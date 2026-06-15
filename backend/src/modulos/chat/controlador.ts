/**
 * Controlador del módulo Chat.
 *
 * Expone los endpoints REST de apoyo al chat de soporte entre clientes y
 * tiendas (diseñadores): listado de conversaciones (bandeja), historial de
 * mensajes con un interlocutor concreto y marcado de mensajes como leídos.
 * El envío de mensajes en tiempo real se realiza por Socket.IO (ver
 * `servicioChat.enviar`), por lo que este controlador no incluye un endpoint
 * de envío; estas rutas son complementarias para clientes que no usan socket.
 */
import { Request, Response, NextFunction } from 'express';
import { servicioChat } from './servicio';

export const controladorChat = {
  /**
   * GET /chat/conversaciones
   * Bandeja: lista de conversaciones del usuario autenticado (cliente o tienda),
   * cada una con el último mensaje, su fecha y el número de mensajes no leídos.
   */
  async listarConversaciones(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const conversaciones = await servicioChat.conversaciones(peticion.usuario!.sub);
      respuesta.status(200).json({ conversaciones });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * GET /chat/:peerId/mensajes
   * Historial REST con un peer (alternativa al evento de socket "mensaje_historial").
   * Devuelve los mensajes intercambiados entre el usuario autenticado y `peerId`
   * en orden cronológico ascendente.
   */
  async historial(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const mensajes = await servicioChat.historial(peticion.usuario!.sub, peticion.params.peerId);
      respuesta.status(200).json({ mensajes });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * PATCH /chat/:peerId/leer
   * Marca como leídos todos los mensajes que el usuario autenticado ha recibido
   * de `peerId` y que aún no había leído. No devuelve cuerpo (204).
   */
  async marcarLeida(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioChat.marcarLeidos(peticion.usuario!.sub, peticion.params.peerId);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
