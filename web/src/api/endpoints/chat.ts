// Endpoints REST del chat de soporte (cliente ↔ tienda). Conversaciones → { conversaciones };
// historial → { mensajes }. El ENVÍO de mensajes NO es REST: va por Socket.IO (enviar_mensaje).
import { solicitar } from '../clienteApi';
import type { ConversacionChat, MensajeChat } from '../tipos';

export const apiChat = {
  async conversaciones(): Promise<ConversacionChat[]> {
    const { conversaciones } = await solicitar<{ conversaciones: ConversacionChat[] }>(
      '/chat/conversaciones',
    );
    return conversaciones;
  },

  async historial(peerId: string): Promise<MensajeChat[]> {
    const { mensajes } = await solicitar<{ mensajes: MensajeChat[] }>(`/chat/${peerId}/mensajes`);
    return mensajes;
  },

  marcarLeida(peerId: string): Promise<void> {
    return solicitar<void>(`/chat/${peerId}/leer`, { metodo: 'PATCH' });
  },
};
