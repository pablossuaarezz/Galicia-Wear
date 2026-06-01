import { Request, Response, NextFunction } from 'express';
import { servicioEnvios, type DatosActualizarEnvioDto } from './servicio';

export const controladorEnvios = {
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
