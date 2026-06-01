// JUSTIFICACIÓN: lógica de negocio de autenticación. Aísla el handler HTTP de las
// decisiones (hashing, expiraciones, rotación de tokens, ...). Es la única parte testable
// sin levantar Express. Cumple separación de capas Controller-Service-Repository.
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

function calcularFechaExpiracionRefresco(): Date {
  const ahora = Date.now();
  const sufijo = entorno.JWT_REFRESH_EXPIRES_IN.slice(-1);
  const valor = Number(entorno.JWT_REFRESH_EXPIRES_IN.slice(0, -1));
  const dias =
    sufijo === 'd' ? valor : sufijo === 'h' ? valor / 24 : sufijo === 'm' ? valor / 1440 : 7;
  return new Date(ahora + dias * 24 * 60 * 60 * 1000);
}

function firmarTokenAcceso(payload: PayloadJwt): string {
  const opciones: SignOptions = { expiresIn: entorno.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, entorno.JWT_SECRET, opciones);
}

function generarTokenRefresco(): { plano: string; hash: string } {
  // Token opaco aleatorio + SHA-256. Nunca guardamos el plano en BBDD.
  const plano = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(plano).digest('hex');
  return { plano, hash };
}

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
  async registrar(
    datos: DatosRegistro,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    const correo = datos.correo.toLowerCase();

    const existente = await repositorioAutenticacion.buscarPorCorreo(correo);
    if (existente) {
      throw new ErrorConflicto('Ya existe una cuenta con ese correo');
    }

    // Para CLIENTE exigimos al menos nombre+apellidos si los manda; el DISEÑADOR
    // completa su perfil después en el endpoint específico de diseñador.
    if (datos.rol === Rol.CLIENTE && (!datos.nombre || !datos.apellidos)) {
      throw new ErrorReglaDeNegocio('Nombre y apellidos son obligatorios para clientes');
    }

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

    await repositorioAutenticacion.guardarTokenRefresco({
      usuarioId: usuario.id,
      hashToken: tokens.tokenRefrescoHash,
      fechaExpiracion: calcularFechaExpiracionRefresco(),
      agenteUsuario: contexto.agenteUsuario,
      ipOrigen: contexto.ipOrigen,
    });

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

  async iniciarSesion(
    datos: DatosLogin,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    const usuario = await repositorioAutenticacion.buscarPorCorreo(datos.correo.toLowerCase());

    // Mensaje genérico para no filtrar si el correo existe (evita user enumeration)
    if (!usuario || usuario.fechaEliminacion) {
      throw new ErrorNoAutenticado('Credenciales inválidas');
    }

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

  async refrescarSesion(
    tokenRefrescoPlano: string,
    contexto: { agenteUsuario?: string; ipOrigen?: string } = {},
  ): Promise<RespuestaTokens> {
    const hash = crypto.createHash('sha256').update(tokenRefrescoPlano).digest('hex');
    const registro = await repositorioAutenticacion.buscarTokenRefrescoPorHash(hash);

    if (!registro) {
      throw new ErrorNoAutenticado('Token de refresco no reconocido');
    }
    if (registro.fechaRevocacion) {
      // Reuso de token revocado → posible robo. Revocamos todos los tokens del usuario.
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
  async obtenerPerfil(usuarioId: string): Promise<{
    id: string;
    correo: string;
    rol: Rol;
    nombre: string | null;
    apellidos: string | null;
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
      nombre: usuario.cliente?.nombre ?? usuario.disenador?.nombreMarca ?? null,
      apellidos: usuario.cliente?.apellidos ?? null,
      fechaCreacion: usuario.fechaCreacion,
    };
  },

  async cerrarSesion(tokenRefrescoPlano: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(tokenRefrescoPlano).digest('hex');
    const registro = await repositorioAutenticacion.buscarTokenRefrescoPorHash(hash);
    if (registro && !registro.fechaRevocacion) {
      await repositorioAutenticacion.revocarTokenRefresco(registro.id);
    }
    // No revelamos si el token existía o no — cerrar sesión es idempotente.
  },
};
