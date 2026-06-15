// Endpoints de direcciones del usuario. Respuestas envueltas: { direcciones } / { direccion }.
// CRUD completo de las direcciones de envío del cliente autenticado, más la operación de
// marcar una dirección como predeterminada. Las respuestas de recurso van envueltas y se
// desenvuelven aquí para devolver directamente la entidad o la lista de entidades.
import { solicitar } from '../clienteApi';
import type { Direccion, EntradaDireccion } from '../tipos';

/**
 * Cliente de los endpoints de direcciones de envío del cliente.
 */
export const apiDirecciones = {
  /**
   * Lista todas las direcciones del usuario autenticado.
   * Endpoint: GET /direcciones.
   * @returns Promesa con el array de direcciones (se desenvuelve { direcciones }).
   */
  async listar(): Promise<Direccion[]> {
    const { direcciones } = await solicitar<{ direcciones: Direccion[] }>('/direcciones');
    return direcciones;
  },

  /**
   * Crea una nueva dirección de envío.
   * Endpoint: POST /direcciones.
   * @param datos Datos de la dirección (alias, líneas, ciudad, código postal, etc.).
   * @returns Promesa con la dirección creada (se desenvuelve { direccion }).
   */
  async crear(datos: EntradaDireccion): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>('/direcciones', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return direccion;
  },

  /**
   * Actualiza parcialmente una dirección existente.
   * Endpoint: PATCH /direcciones/{id}.
   * @param id Identificador de la dirección a modificar.
   * @param datos Campos a actualizar (parcial de EntradaDireccion).
   * @returns Promesa con la dirección actualizada (se desenvuelve { direccion }).
   */
  async actualizar(id: string, datos: Partial<EntradaDireccion>): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>(`/direcciones/${id}`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return direccion;
  },

  /**
   * Elimina una dirección del usuario.
   * Endpoint: DELETE /direcciones/{id}.
   * @param id Identificador de la dirección a eliminar.
   * @returns Promesa que se resuelve al completarse (sin cuerpo).
   */
  eliminar(id: string): Promise<void> {
    return solicitar<void>(`/direcciones/${id}`, { metodo: 'DELETE' });
  },

  /**
   * Marca una dirección como predeterminada (principal) para los envíos del usuario.
   * Endpoint: PATCH /direcciones/{id}/principal.
   * @param id Identificador de la dirección a marcar como principal.
   * @returns Promesa con la dirección actualizada (se desenvuelve { direccion }).
   */
  async marcarPrincipal(id: string): Promise<Direccion> {
    const { direccion } = await solicitar<{ direccion: Direccion }>(`/direcciones/${id}/principal`, {
      metodo: 'PATCH',
    });
    return direccion;
  },
};
