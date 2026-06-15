// Endpoints de autenticación. Estas respuestas NO van envueltas en { clave }.
// Conjunto de operaciones del ciclo de vida de la sesión: registro de cuenta, inicio de
// sesión, consulta del perfil autenticado y cierre de sesión. Las operaciones de
// registro/login/logout se marcan con `autenticar: false` porque no requieren (o no deben
// adjuntar) el token de acceso; a diferencia de la mayoría de recursos, sus respuestas
// devuelven el DTO directamente sin el envoltorio { clave }.
import { solicitar, obtenerTokenRefresco } from '../clienteApi';
import type { EntradaLogin, EntradaRegistro, PerfilUsuario, RespuestaTokens } from '../tipos';

/**
 * Cliente de los endpoints de autenticación de la API.
 * Agrupa el alta de cuenta, el inicio/cierre de sesión y la consulta del perfil.
 */
export const apiAuth = {
  /**
   * Registra una nueva cuenta (cliente o diseñador) y abre sesión inmediatamente.
   * Endpoint: POST /auth/registro (público, sin Authorization).
   * @param datos Datos de alta: correo, contraseña, rol y, opcionalmente, nombre/apellidos.
   * @returns Promesa con los tokens de sesión recién emitidos y el usuario asociado.
   */
  registro(datos: EntradaRegistro): Promise<RespuestaTokens> {
    return solicitar<RespuestaTokens>('/auth/registro', {
      metodo: 'POST',
      cuerpo: datos,
      autenticar: false,
    });
  },

  /**
   * Inicia sesión con credenciales de correo y contraseña.
   * Endpoint: POST /auth/login (público, sin Authorization).
   * @param datos Credenciales de acceso (correo y contraseña).
   * @returns Promesa con los tokens de acceso/refresco y el usuario autenticado.
   */
  login(datos: EntradaLogin): Promise<RespuestaTokens> {
    return solicitar<RespuestaTokens>('/auth/login', {
      metodo: 'POST',
      cuerpo: datos,
      autenticar: false,
    });
  },

  /**
   * Recupera el perfil del usuario autenticado a partir del token de acceso vigente.
   * Se usa al arrancar la aplicación para rehidratar la sesión tras renovar el token.
   * Endpoint: GET /auth/yo (requiere Authorization).
   * @returns Promesa con el perfil plano y ligero del usuario.
   */
  yo(): Promise<PerfilUsuario> {
    return solicitar<PerfilUsuario>('/auth/yo');
  },

  /**
   * Cierra la sesión en el servidor invalidando el token de refresco actual.
   * Endpoint: POST /auth/logout (recibe el tokenRefresco en el cuerpo).
   * Operación "best-effort": si no hay token de refresco no hace nada y, si el servidor
   * falla, se ignora el error porque la limpieza local de la sesión la realiza de todos
   * modos quien invoca este método (ContextoSesion).
   * @returns Promesa que se resuelve siempre, con o sin éxito en el servidor.
   */
  async logout(): Promise<void> {
    const tokenRefresco = obtenerTokenRefresco();
    if (!tokenRefresco) return;
    // Best-effort: si el servidor falla, igualmente limpiamos la sesión en el cliente.
    await solicitar<void>('/auth/logout', {
      metodo: 'POST',
      cuerpo: { tokenRefresco },
      autenticar: false,
    }).catch(() => undefined);
  },
};
