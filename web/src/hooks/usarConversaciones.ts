// Lista de conversaciones del chat (bandeja). Se refresca por sondeo suave; las páginas de chat
// también la invalidan al recibir/leer mensajes para mantener los contadores al día.
import { useQuery } from '@tanstack/react-query';
import { apiChat } from '@/api/endpoints/chat';
import { usarSesion } from '@/contexto/ContextoSesion';

export function usarConversaciones() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => apiChat.conversaciones(),
    enabled: estaAutenticado,
    refetchInterval: 25_000,
  });
}
