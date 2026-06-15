// Controlador HTTP del módulo de variantes.
// Las variantes representan combinaciones de talla/color/SKU/stock para un
// producto concreto. Este controlador se monta como sub-router anidado bajo
// /productos/:productoId/variantes, por lo que todas las operaciones reciben
// `productoId` desde los parámetros de la ruta padre (gracias a `mergeParams`).

import { Request, Response, NextFunction } from 'express';
import { servicioVariantes } from './servicio';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export const controladorVariantes = {
  /**
   * Lista todas las variantes de un producto, ordenadas por talla y color.
   * @param peticion Request de Express; `peticion.params.productoId` es el id del producto padre.
   * @param respuesta Responde con 200 y la lista de variantes.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const variantes = await servicioVariantes.listar(peticion.params.productoId);
      respuesta.status(200).json({ variantes });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Crea una nueva variante para un producto, comprobando que el usuario
   * autenticado es el diseñador propietario del producto.
   * @param peticion Request de Express; `peticion.params.productoId` es el id del producto
   *                  y `peticion.body` contiene `DatosCrearVariante`.
   * @param respuesta Responde con 201 y la variante creada.
   */
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

  /**
   * Actualiza parcialmente una variante existente (p. ej. stock, color, ajuste de precio),
   * comprobando que la variante pertenece al producto indicado y que el
   * usuario autenticado es el diseñador propietario.
   * @param peticion Request de Express; `peticion.params.id` es el id de la variante,
   *                  `peticion.params.productoId` el id del producto padre,
   *                  y `peticion.body` contiene `DatosActualizarVariante`.
   * @param respuesta Responde con 200 y la variante actualizada.
   */
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

  /**
   * Elimina una variante de un producto, comprobando que pertenece al
   * producto indicado y que el usuario autenticado es su propietario.
   * @param peticion Request de Express; `peticion.params.id` es el id de la variante
   *                  y `peticion.params.productoId` el id del producto padre.
   * @param respuesta Responde con 204 sin contenido.
   */
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
