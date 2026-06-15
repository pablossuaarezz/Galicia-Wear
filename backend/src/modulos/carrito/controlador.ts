/**
 * Controlador del módulo Carrito.
 *
 * Capa de manejadores HTTP (Express) para las operaciones del carrito de la compra
 * del cliente autenticado: obtener el carrito, añadir/actualizar artículos, eliminar
 * un artículo concreto y vaciar el carrito completo.
 * Toda la lógica de negocio y autorización se delega en `servicioCarrito`; este
 * controlador solo se encarga de leer la petición, invocar al servicio y
 * formatear la respuesta HTTP, propagando cualquier error al manejador central
 * de errores mediante `siguiente(error)`.
 */
import { Request, Response, NextFunction } from 'express';
import { servicioCarrito } from './servicio';
import type { DatosAgregarItem } from './dto';

export const controladorCarrito = {
  /**
   * GET /carrito
   * Devuelve el carrito (con sus ítems detallados) del cliente autenticado.
   * El identificador de usuario y su rol se extraen del token JWT verificado
   * previamente por el middleware de autenticación (`peticion.usuario`).
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const carrito = await servicioCarrito.obtener(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
      );
      respuesta.status(200).json({ carrito });
    } catch (error) {
      // Cualquier error (acceso denegado, no encontrado, etc.) se delega al
      // middleware de manejo de errores global para mantener respuestas consistentes.
      siguiente(error);
    }
  },

  /**
   * POST /carrito/items
   * Añade una variante de producto al carrito o, si ya existe, actualiza su cantidad.
   * El cuerpo de la petición ya ha sido validado por el middleware `validar(dtoAgregarItem)`,
   * por lo que `varianteId` y `cantidad` llegan con el formato correcto.
   */
  async agregarItem(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      // El body ya pasó la validación Zod en la ruta; el cast es seguro.
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

  /**
   * DELETE /carrito/items/:varianteId
   * Elimina del carrito del cliente el artículo correspondiente a la variante indicada
   * en el parámetro de ruta. Devuelve el carrito actualizado tras la eliminación.
   */
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

  /**
   * DELETE /carrito
   * Vacía por completo el carrito del cliente autenticado, eliminando todos sus
   * ítems. Responde con 204 (sin contenido) al no haber cuerpo que devolver.
   */
  async vaciar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioCarrito.vaciar(peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
