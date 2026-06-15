// Notificaciones in-app. El contador (badge) se refresca por sondeo cada 30 s mientras hay
// sesión; es una alternativa robusta y offline-friendly al tiempo real con Socket.IO (que el
// backend también soporta vía la sala usuario:<sub>, queda como mejora futura).
//
// Este módulo agrupa los hooks relacionados con las notificaciones internas de la aplicación:
// el contador de notificaciones no leídas (para mostrar un badge en la campanita) y el listado
// completo con las mutaciones para marcarlas como leídas.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiNotificaciones } from '@/api/endpoints/notificaciones';
import { usarSesion } from '@/contexto/ContextoSesion';

/**
 * Obtiene el número de notificaciones no leídas del usuario autenticado.
 *
 * @returns El resultado de `useQuery` con el contador de notificaciones. Se ejecuta solo con
 *   sesión iniciada, se sondea cada 30 segundos y también se refresca al recuperar el foco
 *   de la ventana (`refetchOnWindowFocus`).
 */
export function usarContadorNotificaciones() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['notificaciones', 'contador'],
    queryFn: () => apiNotificaciones.contador(),
    enabled: estaAutenticado,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Obtiene el listado de notificaciones del usuario autenticado y expone mutaciones para
 * marcarlas como leídas (individualmente o todas a la vez).
 *
 * @returns Un objeto con:
 *   - `notificaciones`: array de notificaciones (vacío si no hay datos todavía).
 *   - `total`: número total de notificaciones devueltas por el backend.
 *   - `cargando`: indica si la consulta inicial está en curso.
 *   - `marcarLeida(id)`: marca una notificación concreta como leída.
 *   - `marcarTodas()`: marca todas las notificaciones como leídas.
 */
export function usarNotificaciones() {
  const { estaAutenticado } = usarSesion();
  const clienteConsultas = useQueryClient();

  const consulta = useQuery({
    queryKey: ['notificaciones', 'lista'],
    queryFn: () => apiNotificaciones.listar(1, 30),
    enabled: estaAutenticado,
  });

  // Tras marcar como leída(s), se invalidan tanto el contador como el listado para que la UI
  // (badge y lista) se mantengan sincronizados con el backend.
  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['notificaciones'] });
  }

  const marcarLeida = useMutation({
    mutationFn: (id: string) => apiNotificaciones.marcarLeida(id),
    onSuccess: invalidar,
  });

  const marcarTodas = useMutation({
    mutationFn: () => apiNotificaciones.marcarTodasLeidas(),
    onSuccess: invalidar,
  });

  return {
    notificaciones: consulta.data?.notificaciones ?? [],
    total: consulta.data?.total ?? 0,
    cargando: consulta.isLoading,
    marcarLeida: (id: string) => marcarLeida.mutate(id),
    marcarTodas: () => marcarTodas.mutate(),
  };
}
