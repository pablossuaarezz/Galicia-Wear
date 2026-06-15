// Controlador HTTP del módulo de notificaciones: expone la bandeja de notificaciones
// del usuario autenticado (listado paginado, contador de no leídas y marcado como
// leídas). Todas las rutas requieren JWT (ver rutas.ts) y operan únicamente sobre las
// notificaciones del usuario que realiza la petición (`peticion.usuario!.sub`).
import { Request, Response, NextFunction } from 'express';
import { servicioNotificaciones } from './servicio';
import { dtoListarNotificaciones } from './dto';

export const controladorNotificaciones = {
  // GET /notificaciones?pagina=&limite= → { notificaciones, total }
  /**
   * Lista paginada de notificaciones del usuario autenticado.
   * Valida los query params (`pagina`, `limite`) con `dtoListarNotificaciones` y delega
   * en el servicio. Cualquier error (validación o de servicio) se delega al middleware
   * de errores vía `siguiente`.
   */
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
  /**
   * Devuelve el número de notificaciones no leídas del usuario autenticado, usado para
   * mostrar el contador/badge en la interfaz.
   */
  async contador(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const noLeidas = await servicioNotificaciones.contador(peticion.usuario!.sub);
      respuesta.status(200).json({ noLeidas });
    } catch (error) {
      siguiente(error);
    }
  },

  // PATCH /notificaciones/:id/leer → 204
  /**
   * Marca una notificación concreta (`peticion.params.id`) como leída, siempre que
   * pertenezca al usuario autenticado. Responde 204 (sin contenido) sin importar si
   * realmente se modificó algo, para mantener la operación idempotente desde el punto
   * de vista del cliente.
   */
  async marcarLeida(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioNotificaciones.marcarLeida(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  // PATCH /notificaciones/leer-todas → { actualizadas }
  /**
   * Marca todas las notificaciones pendientes del usuario autenticado como leídas y
   * devuelve cuántas se han actualizado.
   */
  async marcarTodasLeidas(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const actualizadas = await servicioNotificaciones.marcarTodasLeidas(peticion.usuario!.sub);
      respuesta.status(200).json({ actualizadas });
    } catch (error) {
      siguiente(error);
    }
  },
};
