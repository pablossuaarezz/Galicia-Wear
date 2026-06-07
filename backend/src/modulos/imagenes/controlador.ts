import { Request, Response, NextFunction } from 'express';
import { servicioImagenes } from './servicio';
import { guardarImagenBase64 } from '../../configuracion/almacenamiento';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

export const controladorImagenes = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const imagenes = await servicioImagenes.listar(peticion.params.productoId);
      respuesta.status(200).json({ imagenes });
    } catch (error) {
      siguiente(error);
    }
  },

  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = peticion.body as DatosCrearImagen;
      // Si llega una imagen base64 (subida desde la app), se guarda como archivo
      // y se almacena su URL pública; así la columna SQL guarda solo la ruta.
      if (datos.base64) {
        const rutaRelativa = guardarImagenBase64(datos.base64);
        const base = `${peticion.protocol}://${peticion.get('host')}`;
        datos.url = `${base}${rutaRelativa}`;
        delete datos.base64;
      }
      const imagen = await servicioImagenes.crear(
        peticion.params.productoId,
        peticion.usuario!.sub,
        datos,
      );
      respuesta.status(201).json({ imagen });
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
      const imagen = await servicioImagenes.actualizar(
        peticion.params.id,
        peticion.params.productoId,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarImagen,
      );
      respuesta.status(200).json({ imagen });
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
      const imagen = await servicioImagenes.marcarPrincipal(
        peticion.params.id,
        peticion.params.productoId,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ imagen });
    } catch (error) {
      siguiente(error);
    }
  },

  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioImagenes.eliminar(
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
