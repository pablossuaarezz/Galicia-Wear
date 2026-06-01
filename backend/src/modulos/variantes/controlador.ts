import { Request, Response, NextFunction } from 'express';
import { servicioVariantes } from './servicio';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export const controladorVariantes = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const variantes = await servicioVariantes.listar(peticion.params.productoId);
      respuesta.status(200).json({ variantes });
    } catch (error) {
      siguiente(error);
    }
  },

  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const variante = await servicioVariantes.crear(
        peticion.params.productoId,
        peticion.usuario!.sub,
        peticion.body as DatosCrearVariante,
      );
      respuesta.status(201).json({ variante });
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
      const variante = await servicioVariantes.actualizar(
        peticion.params.id,
        peticion.params.productoId,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarVariante,
      );
      respuesta.status(200).json({ variante });
    } catch (error) {
      siguiente(error);
    }
  },

  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioVariantes.eliminar(
        peticion.params.id,
        peticion.params.productoId,
        peticion.usuario!.sub,
      );
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
