// Endpoints REST del chat de soporte (cliente ↔ tienda). Conversaciones → { conversaciones };
// historial → { mensajes }. El ENVÍO de mensajes NO es REST: va por Socket.IO (enviar_mensaje).
// Este módulo cubre solo la parte "fría" del chat: listar conversaciones, cargar el historial
// de una conversación y marcarla como leída. La mensajería en tiempo real (envío y recepción
// instantánea) se gestiona aparte mediante el cliente de Socket.IO.
import { solicitar } from '../clienteApi';
import type { ConversacionChat, MensajeChat } from '../tipos';

/**
 * Cliente de los endpoints REST del chat de soporte.
 */
export const apiChat = {
  /**
   * Lista las conversaciones del usuario autenticado con su último mensaje y nº de no leídos.
   * Endpoint: GET /chat/conversaciones.
   * @returns Promesa con el array de conversaciones (se desenvuelve { conversaciones }).
   */
  async conversaciones(): Promise<ConversacionChat[]> {
    const { conversaciones } = await solicitar<{ conversaciones: ConversacionChat[] }>(
      '/chat/conversaciones',
    );
    return conversaciones;
  },

  /**
   * Carga el historial de mensajes de la conversación con un interlocutor concreto.
   * Endpoint: GET /chat/{peerId}/mensajes.
   * @param peerId Identificador del interlocutor (peer) de la conversación.
   * @returns Promesa con el array de mensajes (se desenvuelve { mensajes }).
   */
  async historial(peerId: string): Promise<MensajeChat[]> {
    const { mensajes } = await solicitar<{ mensajes: MensajeChat[] }>(`/chat/${peerId}/mensajes`);
    return mensajes;
  },

  /**
   * Marca como leídos todos los mensajes recibidos de un interlocutor.
   * Endpoint: PATCH /chat/{peerId}/leer.
   * @param peerId Identificador del interlocutor cuya conversación se marca como leída.
   * @returns Promesa que se resuelve al completarse (sin cuerpo).
   */
  marcarLeida(peerId: string): Promise<void> {
    return solicitar<void>(`/chat/${peerId}/leer`, { metodo: 'PATCH' });
  },
};
