// Endpoints de notificaciones (bandeja in-app + badge). Bandeja → { notificaciones, total };
// contador → { noLeidas }; marcar todas → { actualizadas }.
import { solicitar } from '../clienteApi';
import type { Notificacion } from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST de notificaciones in-app del usuario:
 * la bandeja paginada, el contador de no leídas (badge) y el marcado como leído.
 */
export const apiNotificaciones = {
  /**
   * Recupera la bandeja paginada de notificaciones del usuario autenticado.
   * Llama a GET /notificaciones.
   * @param pagina Número de página (por defecto 1).
   * @param limite Tamaño de página (por defecto 20).
   * @returns Lista de notificaciones y total disponible.
   */
  listar(
    pagina = 1,
    limite = 20,
  ): Promise<{ notificaciones: Notificacion[]; total: number }> {
    return solicitar<{ notificaciones: Notificacion[]; total: number }>('/notificaciones', {
      params: { pagina, limite },
    });
  },

  /**
   * Obtiene el número de notificaciones sin leer (para el badge de la campana).
   * Llama a GET /notificaciones/contador.
   * @returns Cantidad de notificaciones no leídas.
   */
  async contador(): Promise<number> {
    const { noLeidas } = await solicitar<{ noLeidas: number }>('/notificaciones/contador');
    return noLeidas;
  },

  /**
   * Marca una notificación concreta como leída. Llama a PATCH /notificaciones/:id/leer.
   * @param id Identificador de la notificación.
   */
  marcarLeida(id: string): Promise<void> {
    return solicitar<void>(`/notificaciones/${id}/leer`, { metodo: 'PATCH' });
  },

  /**
   * Marca todas las notificaciones del usuario como leídas (vacía el badge).
   * Llama a PATCH /notificaciones/leer-todas.
   * @returns Número de notificaciones que pasaron a leídas.
   */
  async marcarTodasLeidas(): Promise<number> {
    const { actualizadas } = await solicitar<{ actualizadas: number }>(
      '/notificaciones/leer-todas',
      { metodo: 'PATCH' },
    );
    return actualizadas;
  },
};
