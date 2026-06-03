import { Request, Response, NextFunction } from 'express';
import { servicioProductos } from './servicio';
import { dtoFiltrosProductos, type DatosCrearProducto, type DatosActualizarProducto } from './dto';

export const controladorProductos = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoFiltrosProductos.parse(peticion.query);
      const resultado = await servicioProductos.listar(filtros);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  async listarMios(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const resultado = await servicioProductos.listarMios(peticion.usuario!.sub);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  async obtenerMia(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const producto = await servicioProductos.obtenerMia(
        peticion.params.id,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ producto });
    } catch (error) {
      siguiente(error);
    }
  },

  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const producto = await servicioProductos.obtenerPorSlug(peticion.params.slug);
      respuesta.status(200).json({ producto });
    } catch (error) {
      siguiente(error);
    }
  },

  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const producto = await servicioProductos.crear(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
        peticion.body as DatosCrearProducto,
      );
      respuesta.status(201).json({ producto });
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
      const producto = await servicioProductos.actualizar(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarProducto,
      );
      respuesta.status(200).json({ producto });
    } catch (error) {
      siguiente(error);
    }
  },

  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioProductos.eliminar(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
