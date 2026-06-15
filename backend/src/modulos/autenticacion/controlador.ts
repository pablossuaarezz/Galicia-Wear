// JUSTIFICACIÓN: capa Controller. Convierte petición HTTP en parámetros del servicio y la
// respuesta del servicio en JSON HTTP. NO contiene lógica de negocio.
//
// Este fichero implementa los controladores de los endpoints de autenticación: registro,
// login, refresco de tokens, logout y obtención del perfil propio. La validación del
// cuerpo de la petición se realiza previamente mediante los DTO de zod (middleware
// `validar`), por lo que aquí se asume que `peticion.body` ya tiene la forma esperada.
import { Request, Response, NextFunction } from 'express';
import { servicioAutenticacion } from './servicio';
import type { DatosLogin, DatosRefresco, DatosRegistro } from './dto';

/**
 * Extrae metadatos de la petición HTTP (agente de usuario e IP de origen) que se
 * registran junto con el token de refresco y en el log de auditoría, para poder
 * identificar/revocar sesiones por dispositivo.
 * @param peticion Petición Express en curso.
 * @returns Objeto con `agenteUsuario` e `ipOrigen` (ambos opcionales).
 */
function extraerContexto(peticion: Request) {
  return {
    agenteUsuario: peticion.header('user-agent') ?? undefined,
    ipOrigen: peticion.ip ?? undefined,
  };
}

export const controladorAutenticacion = {
  /**
   * POST /auth/registro
   * Registra un nuevo usuario (cliente o diseñador) y devuelve la pareja de tokens
   * (acceso + refresco) recién emitida, dejando al usuario con sesión iniciada.
   * @param respuesta Responde 201 con {@link RespuestaTokens}.
   * @throws ErrorConflicto si el correo ya está en uso (gestionado por el servicio).
   */
  async registrar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = peticion.body as DatosRegistro;
      const tokens = await servicioAutenticacion.registrar(datos, extraerContexto(peticion));
      respuesta.status(201).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * POST /auth/login
   * Verifica las credenciales (correo + contraseña) y, si son válidas, emite una
   * nueva pareja de tokens.
   * @param respuesta Responde 200 con {@link RespuestaTokens}.
   * @throws ErrorNoAutenticado si las credenciales no son válidas (mensaje genérico
   * para no revelar si el correo existe).
   */
  async iniciarSesion(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const datos = peticion.body as DatosLogin;
      const tokens = await servicioAutenticacion.iniciarSesion(datos, extraerContexto(peticion));
      respuesta.status(200).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * POST /auth/refresh
   * Renueva la sesión a partir de un token de refresco válido, aplicando rotación
   * (el token usado se revoca y se emite uno nuevo).
   * @param respuesta Responde 200 con la nueva pareja de tokens {@link RespuestaTokens}.
   * @throws ErrorNoAutenticado si el token es inválido, expirado o ya revocado
   * (en cuyo caso además se revocan todas las sesiones del usuario por seguridad).
   */
  async refrescar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const { tokenRefresco } = peticion.body as DatosRefresco;
      const tokens = await servicioAutenticacion.refrescarSesion(
        tokenRefresco,
        extraerContexto(peticion),
      );
      respuesta.status(200).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * POST /auth/logout
   * Cierra la sesión actual revocando el token de refresco indicado. La operación
   * es idempotente: no informa si el token existía o no.
   * @param respuesta Responde 204 sin contenido.
   */
  async cerrarSesion(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const { tokenRefresco } = peticion.body as DatosRefresco;
      await servicioAutenticacion.cerrarSesion(tokenRefresco);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  // Endpoint protegido — devuelve el perfil completo del usuario autenticado.
  /**
   * GET /auth/yo
   * Devuelve el perfil del usuario autenticado (identificado por el JWT validado
   * en el middleware `verificarJwt`, que rellena `peticion.usuario`).
   * @param respuesta Responde 200 con los datos de perfil (id, correo, rol, nombre, etc.).
   * @throws ErrorNoAutenticado si el usuario ya no existe o ha sido eliminado.
   */
  async obtenerMiPerfil(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      // El operador `!` es seguro aquí porque `verificarJwt` garantiza que
      // `peticion.usuario` está presente antes de llegar a este controlador.
      const perfil = await servicioAutenticacion.obtenerPerfil(peticion.usuario!.sub);
      respuesta.status(200).json(perfil);
    } catch (error) {
      siguiente(error);
    }
  },
};
