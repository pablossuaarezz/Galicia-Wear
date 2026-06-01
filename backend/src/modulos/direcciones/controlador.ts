import { Request, Response, NextFunction } from 'express';
import { servicioDirecciones } from './servicio';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

export const controladorDirecciones = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const direcciones = await servicioDirecciones.listar(peticion.usuario!.sub);
      respuesta.status(200).json({ direcciones });
    } catch (error) {
      siguiente(error);
    }
  },

  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const direccion = await servicioDirecciones.crear(
        peticion.usuario!.sub,
        peticion.body as DatosCrearDireccion,
      );
      respuesta.status(201).json({ direccion });
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
      const direccion = await servicioDirecciones.actualizar(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarDireccion,
      );
      respuesta.status(200).json({ direccion });
    } catch (error) {
      siguiente(error);
    }
  },

  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioDirecciones.eliminar(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  async marcarPrincipal(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const direccion = await servicioDirecciones.marcarComoPrincipal(
        peticion.params.id,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ direccion });
    } catch (error) {
      siguiente(error);
    }
  },
};
