// Endpoints del perfil de usuario. GET /usuarios/yo → { usuario }; preferencias → { mensaje }.
import { solicitar } from '../clienteApi';
import type {
  EntradaCambiarContrasena,
  EntradaPerfilCliente,
  PreferenciasSostenibilidad,
  UsuarioConPerfil,
} from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST del perfil del usuario autenticado:
 * lectura de su propio perfil, actualización de datos de cliente, cambio de contraseña
 * y preferencias de sostenibilidad.
 */
export const apiUsuarios = {
  /**
   * Obtiene el perfil completo del usuario autenticado. Llama a GET /usuarios/yo.
   * @returns El usuario con su perfil asociado (se desenvuelve la clave `usuario`).
   */
  async yo(): Promise<UsuarioConPerfil> {
    const { usuario } = await solicitar<{ usuario: UsuarioConPerfil }>('/usuarios/yo');
    return usuario;
  },

  /**
   * Actualiza los datos del perfil de cliente del usuario. Llama a PATCH /usuarios/yo/cliente.
   * @param datos Campos del perfil de cliente a modificar (nombre, avatar, etc.).
   * @returns El usuario con su perfil ya actualizado.
   */
  async actualizarCliente(datos: EntradaPerfilCliente): Promise<UsuarioConPerfil> {
    const { usuario } = await solicitar<{ usuario: UsuarioConPerfil }>('/usuarios/yo/cliente', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return usuario;
  },

  /**
   * Cambia la contraseña del usuario autenticado. Llama a PATCH /usuarios/yo/contrasena.
   * @param datos Contraseña actual y nueva contraseña.
   */
  cambiarContrasena(datos: EntradaCambiarContrasena): Promise<void> {
    return solicitar<void>('/usuarios/yo/contrasena', { metodo: 'PATCH', cuerpo: datos });
  },

  /**
   * Actualiza las preferencias de sostenibilidad del usuario (para recomendaciones).
   * Llama a PATCH /usuarios/yo/preferencias.
   * @param datos Preferencias eco del usuario.
   * @returns Mensaje de confirmación del backend.
   */
  actualizarPreferencias(datos: PreferenciasSostenibilidad): Promise<{ mensaje: string }> {
    return solicitar<{ mensaje: string }>('/usuarios/yo/preferencias', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
  },
};
