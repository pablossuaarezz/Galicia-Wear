// Endpoints del perfil de usuario. GET /usuarios/yo → { usuario }; preferencias → { mensaje }.
import { solicitar } from '../clienteApi';
import type {
  EntradaCambiarContrasena,
  EntradaPerfilCliente,
  PreferenciasSostenibilidad,
  UsuarioConPerfil,
} from '../tipos';

export const apiUsuarios = {
  async yo(): Promise<UsuarioConPerfil> {
    const { usuario } = await solicitar<{ usuario: UsuarioConPerfil }>('/usuarios/yo');
    return usuario;
  },

  async actualizarCliente(datos: EntradaPerfilCliente): Promise<UsuarioConPerfil> {
    const { usuario } = await solicitar<{ usuario: UsuarioConPerfil }>('/usuarios/yo/cliente', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return usuario;
  },

  cambiarContrasena(datos: EntradaCambiarContrasena): Promise<void> {
    return solicitar<void>('/usuarios/yo/contrasena', { metodo: 'PATCH', cuerpo: datos });
  },

  actualizarPreferencias(datos: PreferenciasSostenibilidad): Promise<{ mensaje: string }> {
    return solicitar<{ mensaje: string }>('/usuarios/yo/preferencias', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
  },
};
