// Endpoints de notificaciones (bandeja in-app + badge). Bandeja → { notificaciones, total };
// contador → { noLeidas }; marcar todas → { actualizadas }.
import { solicitar } from '../clienteApi';
import type { Notificacion } from '../tipos';

export const apiNotificaciones = {
  listar(
    pagina = 1,
    limite = 20,
  ): Promise<{ notificaciones: Notificacion[]; total: number }> {
    return solicitar<{ notificaciones: Notificacion[]; total: number }>('/notificaciones', {
      params: { pagina, limite },
    });
  },

  async contador(): Promise<number> {
    const { noLeidas } = await solicitar<{ noLeidas: number }>('/notificaciones/contador');
    return noLeidas;
  },

  marcarLeida(id: string): Promise<void> {
    return solicitar<void>(`/notificaciones/${id}/leer`, { metodo: 'PATCH' });
  },

  async marcarTodasLeidas(): Promise<number> {
    const { actualizadas } = await solicitar<{ actualizadas: number }>(
      '/notificaciones/leer-todas',
      { metodo: 'PATCH' },
    );
    return actualizadas;
  },
};
