import { Request, Response, NextFunction } from 'express';
import { servicioCarrito } from './servicio';
import type { DatosAgregarItem } from './dto';

export const controladorCarrito = {
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const carrito = await servicioCarrito.obtener(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
      );
      respuesta.status(200).json({ carrito });
    } catch (error) {
      siguiente(error);
    }
  },

  async agregarItem(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const { varianteId, cantidad } = peticion.body as DatosAgregarItem;
      const carrito = await servicioCarrito.agregarItem(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
        varianteId,
        cantidad,
      );
      respuesta.status(200).json({ carrito });
    } catch (error) {
      siguiente(error);
    }
  },

  async eliminarItem(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const carrito = await servicioCarrito.eliminarItem(
        peticion.usuario!.sub,
        peticion.params.varianteId,
      );
      respuesta.status(200).json({ carrito });
    } catch (error) {
      siguiente(error);
    }
  },

  async vaciar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioCarrito.vaciar(peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
