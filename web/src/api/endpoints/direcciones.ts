// Endpoints de direcciones del usuario. Respuestas envueltas: { direcciones } / { direccion }.
import { solicitar } from '../clienteApi';
import type { Direccion, EntradaDireccion } from '../tipos';

export const apiDirecciones = {
  async listar(): Promise<Direccion[]> {
    const { direcciones } = await solicitar<{ direcciones: Direccion[] }>('/direcciones');
    return direcciones;
  },

  async crear(datos: EntradaDireccion): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>('/direcciones', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return direccion;
  },

  async actualizar(id: string, datos: Partial<EntradaDireccion>): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>(`/direcciones/${id}`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return direccion;
  },

  eliminar(id: string): Promise<void> {
    return solicitar<void>(`/direcciones/${id}`, { metodo: 'DELETE' });
  },

  async marcarPrincipal(id: string): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>(`/direcciones/${id}/principal`, {
      metodo: 'PATCH',
    });
    return direccion;
  },
};
