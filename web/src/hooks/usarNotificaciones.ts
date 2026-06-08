// Notificaciones in-app. El contador (badge) se refresca por sondeo cada 30 s mientras hay
// sesión; es una alternativa robusta y offline-friendly al tiempo real con Socket.IO (que el
// backend también soporta vía la sala usuario:<sub>, queda como mejora futura).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiNotificaciones } from '@/api/endpoints/notificaciones';
import { usarSesion } from '@/contexto/ContextoSesion';

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

export function usarNotificaciones() {
  const { estaAutenticado } = usarSesion();
  const clienteConsultas = useQueryClient();

  const consulta = useQuery({
    queryKey: ['notificaciones', 'lista'],
    queryFn: () => apiNotificaciones.listar(1, 30),
    enabled: estaAutenticado,
  });

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
