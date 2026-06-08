// Endpoints de autenticación. Estas respuestas NO van envueltas en { clave }.
import { solicitar, obtenerTokenRefresco } from '../clienteApi';
import type { EntradaLogin, EntradaRegistro, PerfilUsuario, RespuestaTokens } from '../tipos';

export const apiAuth = {
  registro(datos: EntradaRegistro): Promise<RespuestaTokens> {
    return solicitar<RespuestaTokens>('/auth/registro', {
      metodo: 'POST',
      cuerpo: datos,
      autenticar: false,
    });
  },

  login(datos: EntradaLogin): Promise<RespuestaTokens> {
    return solicitar<RespuestaTokens>('/auth/login', {
      metodo: 'POST',
      cuerpo: datos,
      autenticar: false,
    });
  },

  /** Perfil del usuario autenticado; rehidrata la sesión al arrancar. */
  yo(): Promise<PerfilUsuario> {
    return solicitar<PerfilUsuario>('/auth/yo');
  },

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
