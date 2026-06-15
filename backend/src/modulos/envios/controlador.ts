// Controlador HTTP del módulo de envíos.
// Expone los endpoints para consultar y actualizar el envío asociado a un
// pedido. Las rutas están montadas bajo /pedidos/:pedidoId/envio, por lo que
// `peticion.params.pedidoId` identifica el pedido sobre el que se opera.
// Cualquier error lanzado por el servicio se reenvía al middleware de errores
// mediante `siguiente(error)`.
import { Request, Response, NextFunction } from 'express';
import { servicioEnvios, type DatosActualizarEnvioDto } from './servicio';

export const controladorEnvios = {
  /**
   * Obtiene el detalle del envío de un pedido.
   * Solo puede acceder el cliente del pedido o algún diseñador con líneas en él
   * (comprobación realizada en el servicio).
   * @param peticion request autenticado; `params.pedidoId` identifica el pedido.
   * @param respuesta response que devuelve 200 con `{ envio }`.
   * @param siguiente callback de error de Express.
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const envio = await servicioEnvios.obtener(
        peticion.params.pedidoId,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ envio });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Actualiza los datos de envío de un pedido (transportista, seguimiento,
   * marcado como enviado/entregado, etc.). Solo el diseñador con líneas en
   * el pedido puede realizar esta acción (comprobado en el servicio).
   * @param peticion request autenticado; `params.pedidoId` identifica el pedido
   *   y `body` viene validado como `DatosActualizarEnvioDto`.
   * @param respuesta response que devuelve 200 con `{ envio }` actualizado.
   * @param siguiente callback de error de Express.
   */
  async actualizar(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const envio = await servicioEnvios.actualizar(
        peticion.params.pedidoId,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarEnvioDto,
      );
      respuesta.status(200).json({ envio });
    } catch (error) {
      siguiente(error);
    }
  },
};
