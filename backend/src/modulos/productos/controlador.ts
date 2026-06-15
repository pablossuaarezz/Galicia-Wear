// Controlador HTTP del módulo de productos (catálogo de prendas).
// Cada función traduce la petición Express a una llamada al servicio de
// productos y devuelve la respuesta JSON correspondiente, delegando los
// errores en el middleware de manejo de errores mediante `siguiente`.

import { Request, Response, NextFunction } from 'express';
import { servicioProductos } from './servicio';
import { dtoFiltrosProductos, type DatosCrearProducto, type DatosActualizarProducto } from './dto';

export const controladorProductos = {
  /**
   * Lista pública de productos activos, con filtros de búsqueda y
   * sostenibilidad (material, ciudad, km de origen, certificados) y paginación.
   * @param peticion Request de Express; los filtros se leen y validan desde `peticion.query`.
   * @param respuesta Responde con 200 y el resultado paginado.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      // Se valida la query string con Zod aquí (no hay middleware `validar` para query params).
      const filtros = dtoFiltrosProductos.parse(peticion.query);
      const resultado = await servicioProductos.listar(filtros);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Lista el catálogo completo del diseñador autenticado, incluyendo
   * productos inactivos (a diferencia del listado público).
   * @param peticion Request de Express; `peticion.usuario.sub` es el id del diseñador.
   * @param respuesta Responde con 200 y el catálogo propio.
   */
  async listarMios(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const resultado = await servicioProductos.listarMios(peticion.usuario!.sub);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Obtiene el detalle de una prenda propia del diseñador autenticado
   * (incluso si está inactiva), pensado para precargar el formulario de edición.
   * @param peticion Request de Express; `peticion.params.id` es el id del producto.
   * @param respuesta Responde con 200 y el detalle del producto.
   */
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

  /**
   * Obtiene el detalle público de un producto activo a partir de su slug.
   * @param peticion Request de Express; `peticion.params.slug` es el slug del producto.
   * @param respuesta Responde con 200 y el detalle del producto.
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const producto = await servicioProductos.obtenerPorSlug(peticion.params.slug);
      respuesta.status(200).json({ producto });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Crea un nuevo producto para el diseñador autenticado.
   * @param peticion Request de Express; `peticion.body` contiene los datos validados de `DatosCrearProducto`.
   * @param respuesta Responde con 201 y el producto creado.
   */
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

  /**
   * Actualiza parcialmente un producto existente del diseñador autenticado.
   * @param peticion Request de Express; `peticion.params.id` es el id del producto
   *                  y `peticion.body` contiene los campos a actualizar (`DatosActualizarProducto`).
   * @param respuesta Responde con 200 y el producto actualizado.
   */
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

  /**
   * Elimina (soft delete: desactiva) un producto del diseñador autenticado.
   * @param peticion Request de Express; `peticion.params.id` es el id del producto.
   * @param respuesta Responde con 204 sin contenido.
   */
  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioProductos.eliminar(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
