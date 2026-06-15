// JUSTIFICACIÓN: lógica de negocio de autenticación. Aísla el handler HTTP de las
// decisiones (hashing, expiraciones, rotación de tokens, ...). Es la única parte testable
// sin levantar Express. Cumple separación de capas Controller-Service-Repository.
//
// Este módulo implementa el flujo completo de autenticación: registro, login, refresco
// (con rotación de tokens), obtención de perfil y logout. Usa bcrypt para el hash de
// contraseñas, JWT para el token de acceso y un token opaco (hash SHA-256) para el
// token de refresco, que se persiste en BBDD para poder revocarlo.
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { entorno } from '../../configuracion/entorno';
import {
  ErrorConflicto,
  ErrorNoAutenticado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { PayloadJwt } from '../../middlewares/autenticacion';
import { repositorioAutenticacion } from './repositorio';
import { registrarActividad } from '../../utilidades/auditoria';
import type { DatosLogin, DatosRegistro, RespuestaTokens } from './dto';

// ---------- helpers privados ----------

/**
 * Calcula la fecha de expiración del token de refresco a partir de la variable de
 * entorno `JWT_REFRESH_EXPIRES_IN` (formato tipo "7d", "24h", "60m"). El sufijo indica
 * la unidad (d=días, h=horas, m=minutos); si el sufijo no se reconoce, se asume 7 días
 * por defecto.
 * @returns Fecha futura en la que el token de refresco dejará de ser válido.
 */
function calcularFechaExpiracionRefresco(): Date {
  const ahora = Date.now();
  const sufijo = entorno.JWT_REFRESH_EXPIRES_IN.slice(-1);
  const valor = Number(entorno.JWT_REFRESH_EXPIRES_IN.slice(0, -1));
  const dias =
    sufijo === 'd' ? valor : sufijo === 'h' ? valor / 24 : sufijo === 'm' ? valor / 1440 : 7;
  return new Date(ahora + dias * 24 * 60 * 60 * 1000);
}

/**
 * Firma un nuevo token de acceso JWT con el payload indicado y el tiempo de
 * expiración configurado en `JWT_EXPIRES_IN`.
 * @param payload Información del usuario a incluir en el JWT (id, correo y rol).
 * @returns Token JWT firmado con `JWT_SECRET`.
 */
function firmarTokenAcceso(payload: PayloadJwt): string {
  const opciones: SignOptions = { expiresIn: entorno.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, entorno.JWT_SECRET, opciones);
}

/**
 * Genera un nuevo token de refresco opaco (no es un JWT): un valor aleatorio
 * codificado en base64url que se entrega al cliente, junto con su hash SHA-256,
 * que es lo único que se persiste en base de datos.
 * @returns Objeto con el token en claro (`plano`, para enviar al cliente) y su
 * hash (`hash`, para almacenar y comparar más adelante).
 */
function generarTokenRefresco(): { plano: string; hash: string } {
  // Token opaco aleatorio + SHA-256. Nunca guardamos el plano en BBDD.
  const plano = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(plano).digest('hex');
  return { plano, hash };
}

/**
 * Construye la pareja de tokens (acceso + refresco) para un usuario dado.
 * No persiste nada en BBDD: solo genera los valores; el llamador es responsable
 * de guardar el hash del token de refresco mediante `guardarTokenRefresco`.
 * @param usuarioId Identificador del usuario.
 * @param correo Correo electrónico del usuario (incluido en el JWT).
 * @param rol Rol del usuario (incluido en el JWT).
 * @returns Token de acceso firmado, token de refresco en claro y su hash, y el tiempo de expiración del token de acceso.
 */
function construirRespuesta(
  usuarioId: string,
  correo: string,
  rol: Rol,
): { tokenAcceso: string; tokenRefrescoPlano: string; tokenRefrescoHash: string; expiraEn: string } {
  const payload: PayloadJwt = { sub: usuarioId, correo, rol };
  const tokenAcceso = firmarTokenAcceso(payload);
  const { plano: tokenRefrescoPlano, hash: tokenRefrescoHash } = generarTokenRefresco();
  return {
    tokenAcceso,
    tokenRefrescoPlano,
    tokenRefrescoHash,
    expiraEn: entorno.JWT_EXPIRES_IN,
  };
}

// ---------- API pública del servicio ----------

export const servicioAutenticacion = {
  /**
   * Registra un nuevo usuario (cliente o diseñador), crea su perfil asociado si
   * procede, emite la primera pareja de tokens y registra la acción en el log
   * de auditoría.
   * @param datos Datos validados del registro ({@link DatosRegistro}).
   * @param contexto Metadatos de la petición (agente de usuario, IP), usados para
   * el registro del token de refresco y la auditoría.
   * @returns Pareja de tokens y datos básicos del usuario recién creado.
   * @throws ErrorConflicto si ya existe una cuenta con ese correo.
   * @throws ErrorReglaDeNegocio si el rol es CLIENTE y faltan nombre o apellidos.
   */
  async registrar(
    datos: DatosRegistro,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    const correo = datos.correo.toLowerCase();

    // El correo es la clave de unicidad de la cuenta: si ya existe, se rechaza el alta.
    const existente = await repositorioAutenticacion.buscarPorCorreo(correo);
    if (existente) {
      throw new ErrorConflicto('Ya existe una cuenta con ese correo');
    }

    // Para CLIENTE exigimos al menos nombre+apellidos si los manda; el DISEÑADOR
    // completa su perfil después en el endpoint específico de diseñador.
    if (datos.rol === Rol.CLIENTE && (!datos.nombre || !datos.apellidos)) {
      throw new ErrorReglaDeNegocio('Nombre y apellidos son obligatorios para clientes');
    }

    // Nunca se almacena la contraseña en texto plano: se aplica bcrypt con el
    // número de rondas configurado (BCRYPT_ROUNDS) para dificultar ataques de fuerza bruta.
    const hashContrasena = await bcrypt.hash(datos.contrasena, entorno.BCRYPT_ROUNDS);

    const usuario = await repositorioAutenticacion.crearUsuario({
      correo,
      hashContrasena,
      rol: datos.rol,
      cliente:
        datos.rol === Rol.CLIENTE
          ? { nombre: datos.nombre!, apellidos: datos.apellidos! }
          : undefined,
    });

    const tokens = construirRespuesta(usuario.id, usuario.correo, usuario.rol);

    // Se persiste solo el hash del token de refresco; el valor en claro se
    // devuelve al cliente y nunca se vuelve a recuperar desde BBDD.
    await repositorioAutenticacion.guardarTokenRefresco({
      usuarioId: usuario.id,
      hashToken: tokens.tokenRefrescoHash,
      fechaExpiracion: calcularFechaExpiracionRefresco(),
      agenteUsuario: contexto.agenteUsuario,
      ipOrigen: contexto.ipOrigen,
    });

    // Registro de auditoría: deja constancia del alta del usuario para trazabilidad.
    registrarActividad({
      usuarioId: usuario.id,
      accion: 'REGISTRO',
      recurso: 'usuario',
      recursoId: usuario.id,
      detalles: { rol: usuario.rol },
      ipOrigen: contexto.ipOrigen,
      agenteUsuario: contexto.agenteUsuario,
    });

    return {
      tokenAcceso: tokens.tokenAcceso,
      tokenRefresco: tokens.tokenRefrescoPlano,
      expiraEn: tokens.expiraEn,
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    };
  },

  /**
   * Verifica las credenciales (correo + contraseña) de un usuario y, si son
   * correctas, emite una nueva pareja de tokens y registra la acción de login.
   * @param datos Datos validados del login ({@link DatosLogin}).
   * @param contexto Metadatos de la petición (agente de usuario, IP).
   * @returns Pareja de tokens y datos básicos del usuario autenticado.
   * @throws ErrorNoAutenticado si el usuario no existe, ha sido eliminado o la
   * contraseña no coincide. El mensaje es deliberadamente genérico en ambos casos
   * para no permitir enumerar correos registrados.
   */
  async iniciarSesion(
    datos: DatosLogin,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    const usuario = await repositorioAutenticacion.buscarPorCorreo(datos.correo.toLowerCase());

    // Mensaje genérico para no filtrar si el correo existe (evita user enumeration)
    // Se trata igual la ausencia del usuario que el caso de cuenta eliminada (soft-delete).
    if (!usuario || usuario.fechaEliminacion) {
      throw new ErrorNoAutenticado('Credenciales inválidas');
    }

    // bcrypt.compare recalcula el hash con la sal almacenada y compara de forma
    // segura (tiempo constante) frente a ataques de temporización.
    const contrasenaValida = await bcrypt.compare(datos.contrasena, usuario.hashContrasena);
    if (!contrasenaValida) {
      throw new ErrorNoAutenticado('Credenciales inválidas');
    }

    const tokens = construirRespuesta(usuario.id, usuario.correo, usuario.rol);

    await repositorioAutenticacion.guardarTokenRefresco({
      usuarioId: usuario.id,
      hashToken: tokens.tokenRefrescoHash,
      fechaExpiracion: calcularFechaExpiracionRefresco(),
      agenteUsuario: contexto.agenteUsuario,
      ipOrigen: contexto.ipOrigen,
    });

    registrarActividad({
      usuarioId: usuario.id,
      accion: 'LOGIN',
      recurso: 'usuario',
      recursoId: usuario.id,
      ipOrigen: contexto.ipOrigen,
      agenteUsuario: contexto.agenteUsuario,
    });

    return {
      tokenAcceso: tokens.tokenAcceso,
      tokenRefresco: tokens.tokenRefrescoPlano,
      expiraEn: tokens.expiraEn,
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    };
  },

  /**
   * Renueva la sesión a partir de un token de refresco válido, aplicando
   * rotación: el token presentado se revoca y se emite una pareja nueva.
   * @param tokenRefrescoPlano Token de refresco en claro recibido del cliente.
   * @param contexto Metadatos de la petición (agente de usuario, IP).
   * @returns Nueva pareja de tokens y datos básicos del usuario.
   * @throws ErrorNoAutenticado en los siguientes casos:
   * - El token no existe (hash no encontrado).
   * - El token ya estaba revocado (posible robo: se revocan TODAS las sesiones del usuario).
   * - El token ha expirado.
   * - El usuario asociado ya no existe o ha sido eliminado.
   */
  async refrescarSesion(
    tokenRefrescoPlano: string,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    // Se recalcula el hash del token recibido para buscarlo en BBDD (nunca se
    // almacena ni compara el token en claro).
    const hash = crypto.createHash('sha256').update(tokenRefrescoPlano).digest('hex');
    const registro = await repositorioAutenticacion.buscarTokenRefrescoPorHash(hash);

    if (!registro) {
      throw new ErrorNoAutenticado('Token de refresco no reconocido');
    }
    if (registro.fechaRevocacion) {
      // Reuso de token revocado → posible robo. Revocamos todos los tokens del usuario.
      // Si un token ya revocado se presenta de nuevo, es indicio de que alguien
      // distinto del usuario legítimo lo está usando (p. ej. token robado y reutilizado
      // tras que el usuario legítimo ya rotó su sesión). Por precaución se cierran
      // todas las sesiones activas del usuario.
      await repositorioAutenticacion.revocarTodosLosTokensDeUsuario(registro.usuarioId);
      throw new ErrorNoAutenticado('Token revocado, se han cerrado todas las sesiones');
    }
    if (registro.fechaExpiracion < new Date()) {
      throw new ErrorNoAutenticado('Token de refresco expirado');
    }

    const usuario = await repositorioAutenticacion.buscarPorId(registro.usuarioId);
    if (!usuario || usuario.fechaEliminacion) {
      throw new ErrorNoAutenticado('Usuario no disponible');
    }

    // Rotación: revocamos el viejo y emitimos pareja nueva
    // La rotación de tokens de refresco limita la ventana de uso de un token filtrado:
    // cada uso válido invalida el anterior y genera uno nuevo.
    await repositorioAutenticacion.revocarTokenRefresco(registro.id);
    const tokens = construirRespuesta(usuario.id, usuario.correo, usuario.rol);

    await repositorioAutenticacion.guardarTokenRefresco({
      usuarioId: usuario.id,
      hashToken: tokens.tokenRefrescoHash,
      fechaExpiracion: calcularFechaExpiracionRefresco(),
      agenteUsuario: contexto.agenteUsuario,
      ipOrigen: contexto.ipOrigen,
    });

    return {
      tokenAcceso: tokens.tokenAcceso,
      tokenRefresco: tokens.tokenRefrescoPlano,
      expiraEn: tokens.expiraEn,
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    };
  },

  // Perfil del usuario autenticado para GET /auth/yo. Devuelve un objeto plano con
  // nombre/apellidos resueltos desde el perfil de cliente (o el nombre de marca si es
  // diseñador), que es lo que consume la app Android.
  /**
   * Obtiene el perfil completo del usuario autenticado, combinando los datos
   * básicos del usuario con los de su perfil de cliente o diseñador (según el rol).
   * @param usuarioId Identificador del usuario autenticado (extraído del JWT).
   * @returns Objeto plano con id, correo, rol y datos de perfil (nombre, apellidos,
   * teléfono, avatar y fecha de creación), con `null` en los campos no disponibles.
   * @throws ErrorNoAutenticado si el usuario no existe o ha sido eliminado.
   */
  async obtenerPerfil(usuarioId: string): Promise<{
    id: string;
    correo: string;
    rol: Rol;
    nombre: string | null;
    apellidos: string | null;
    telefono: string | null;
    avatarUrl: string | null;
    fechaCreacion: Date;
  }> {
    const usuario = await repositorioAutenticacion.buscarPerfilCompleto(usuarioId);
    if (!usuario || usuario.fechaEliminacion) {
      throw new ErrorNoAutenticado('Usuario no disponible');
    }
    return {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      // Si el usuario es cliente, se usa su nombre; si es diseñador (sin perfil
      // de cliente), se usa el nombre de marca como "nombre" para mostrar en la UI.
      nombre: usuario.cliente?.nombre ?? usuario.disenador?.nombreMarca ?? null,
      apellidos: usuario.cliente?.apellidos ?? null,
      telefono: usuario.cliente?.telefono ?? null,
      avatarUrl: usuario.cliente?.avatarUrl ?? null,
      fechaCreacion: usuario.fechaCreacion,
    };
  },

  /**
   * Cierra la sesión asociada a un token de refresco, revocándolo si existe y
   * no estaba ya revocado. La operación es idempotente y no informa si el
   * token existía o no, para no filtrar información sobre sesiones activas.
   * @param tokenRefrescoPlano Token de refresco en claro a revocar.
   */
  async cerrarSesion(tokenRefrescoPlano: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(tokenRefrescoPlano).digest('hex');
    const registro = await repositorioAutenticacion.buscarTokenRefrescoPorHash(hash);
    if (registro && !registro.fechaRevocacion) {
      await repositorioAutenticacion.revocarTokenRefresco(registro.id);
    }
    // No revelamos si el token existía o no — cerrar sesión es idempotente.
  },
};
