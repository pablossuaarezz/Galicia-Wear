// Controlador HTTP del módulo de imágenes de producto.
// Gestiona la creación, listado, actualización, marcado como principal y
// eliminación de imágenes asociadas a un producto. En la creación se admite
// tanto una URL directa como una imagen en base64 que el backend persiste
// como archivo en disco (ver `guardarImagenBase64`).
import { Request, Response, NextFunction } from 'express';
import { servicioImagenes } from './servicio';
import { guardarImagenBase64 } from '../../configuracion/almacenamiento';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

export const controladorImagenes = {
  /**
   * Lista las imágenes de un producto, ordenadas (principal primero, luego por posición).
   * @param peticion request con `params.productoId` = id del producto.
   * @param respuesta response que devuelve 200 con `{ imagenes }`.
   * @param siguiente callback de error de Express.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const imagenes = await servicioImagenes.listar(peticion.params.productoId);
      respuesta.status(200).json({ imagenes });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Crea una nueva imagen para un producto. Admite dos formas de entrada:
   * una URL directa (`datos.url`) o una imagen codificada en base64
   * (`datos.base64`, data URI). En este último caso, el controlador guarda
   * la imagen como archivo físico y sustituye `base64` por la URL pública
   * resultante antes de pasar los datos al servicio.
   * @param peticion request autenticado (diseñador); `params.productoId` = id
   *   del producto; `body` validado como `DatosCrearImagen`.
   * @param respuesta response que devuelve 201 con `{ imagen }` creada.
   * @param siguiente callback de error de Express.
   */
  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = peticion.body as DatosCrearImagen;
      // Si llega una imagen base64 (subida desde la app), se guarda como archivo
      // y se almacena su URL pública; así la columna SQL guarda solo la ruta.
      if (datos.base64) {
        // guardarImagenBase64 decodifica el data URI, escribe el archivo en el
        // directorio de almacenamiento configurado y devuelve la ruta relativa
        // pública (p. ej. "/uploads/imagenes/xxxx.jpg").
        const rutaRelativa = guardarImagenBase64(datos.base64);
        // Se construye la URL absoluta a partir del protocolo y host de la
        // petición actual, para que el cliente pueda usarla directamente.
        const base = `${peticion.protocol}://${peticion.get('host')}`;
        datos.url = `${base}${rutaRelativa}`;
        // Se elimina el campo base64 del payload: ya ha sido persistido como
        // archivo y no debe guardarse (ni reenviarse) como texto en la BD.
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

  /**
   * Actualiza metadatos de una imagen existente (texto alternativo, posición).
   * Solo el diseñador propietario del producto puede modificarla (comprobado
   * en el servicio).
   * @param peticion request autenticado; `params.id` = id de la imagen,
   *   `params.productoId` = id del producto, `body` validado como `DatosActualizarImagen`.
   * @param respuesta response que devuelve 200 con `{ imagen }` actualizada.
   * @param siguiente callback de error de Express.
   */
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

  /**
   * Marca una imagen como la imagen principal del producto, desmarcando
   * automáticamente cualquier otra imagen que lo fuera previamente.
   * @param peticion request autenticado; `params.id` = id de la imagen,
   *   `params.productoId` = id del producto.
   * @param respuesta response que devuelve 200 con `{ imagen }` marcada como principal.
   * @param siguiente callback de error de Express.
   */
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

  /**
   * Elimina una imagen de un producto. Solo el diseñador propietario del
   * producto puede eliminarla (comprobado en el servicio).
   * @param peticion request autenticado; `params.id` = id de la imagen,
   *   `params.productoId` = id del producto.
   * @param respuesta response que devuelve 204 sin contenido tras eliminar.
   * @param siguiente callback de error de Express.
   */
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
