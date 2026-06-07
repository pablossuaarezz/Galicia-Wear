import { Request, Response, NextFunction } from 'express';
import { servicioChat } from './servicio';

export const controladorChat = {
  // Bandeja: lista de conversaciones del usuario autenticado (cliente o tienda).
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

  // Historial REST con un peer (alternativa al evento de socket "mensaje_historial").
  async historial(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const mensajes = await servicioChat.historial(peticion.usuario!.sub, peticion.params.peerId);
      respuesta.status(200).json({ mensajes });
    } catch (error) {
      siguiente(error);
    }
  },

  // Marca como leídos los mensajes recibidos de un peer.
  async marcarLeida(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioChat.marcarLeidos(peticion.usuario!.sub, peticion.params.peerId);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
