import { Request, Response, NextFunction } from 'express';
import { servicioNotificaciones } from './servicio';
import { dtoListarNotificaciones } from './dto';

export const controladorNotificaciones = {
  // GET /notificaciones?pagina=&limite= → { notificaciones, total }
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoListarNotificaciones.parse(peticion.query);
      const { notificaciones, total } = await servicioNotificaciones.listar(
        peticion.usuario!.sub,
        filtros,
      );
      respuesta.status(200).json({ notificaciones, total });
    } catch (error) {
      siguiente(error);
    }
  },

  // GET /notificaciones/contador → { noLeidas }
  async contador(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const noLeidas = await servicioNotificaciones.contador(peticion.usuario!.sub);
      respuesta.status(200).json({ noLeidas });
    } catch (error) {
      siguiente(error);
    }
  },

  // PATCH /notificaciones/:id/leer → 204
  async marcarLeida(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioNotificaciones.marcarLeida(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  // PATCH /notificaciones/leer-todas → { actualizadas }
  async marcarTodasLeidas(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const actualizadas = await servicioNotificaciones.marcarTodasLeidas(peticion.usuario!.sub);
      respuesta.status(200).json({ actualizadas });
    } catch (error) {
      siguiente(error);
    }
  },
};
