// Lista de conversaciones del chat (bandeja). Se refresca por sondeo suave; las páginas de chat
// también la invalidan al recibir/leer mensajes para mantener los contadores al día.
//
// Este hook alimenta la bandeja de entrada del chat (lista de conversaciones con su último
// mensaje y contador de no leídos). Combina dos estrategias de actualización: el sondeo
// periódico (`refetchInterval`) y la invalidación manual desde `usarChat` cuando llegan
// mensajes nuevos en tiempo real vía Socket.IO.
import { useQuery } from '@tanstack/react-query';
import { apiChat } from '@/api/endpoints/chat';
import { usarSesion } from '@/contexto/ContextoSesion';

/**
 * Obtiene la lista de conversaciones de chat del usuario autenticado.
 *
 * @returns El resultado de `useQuery` con la lista de conversaciones. La consulta solo se
 *   ejecuta si hay sesión iniciada (`estaAutenticado`) y se refresca automáticamente cada
 *   25 segundos para mantener los contadores de mensajes no leídos actualizados.
 */
export function usarConversaciones() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => apiChat.conversaciones(),
    // Sin sesión no tiene sentido pedir las conversaciones (el endpoint requiere autenticación).
    enabled: estaAutenticado,
    // Sondeo cada 25 s para reflejar mensajes nuevos sin depender únicamente del socket.
    refetchInterval: 25_000,
  });
}
