// Servicio (capa de lógica de negocio) del módulo de productos.
// Gestiona el catálogo de prendas: listados públicos y privados, generación
// de slugs únicos, creación/actualización/eliminación de productos y
// comprobaciones de autorización (solo el diseñador propietario puede
// modificar su producto). Sirve también como punto de verificación de
// propiedad para los módulos de variantes e imágenes.

import crypto from 'node:crypto';
import { Rol } from '@prisma/client';
import {
  ErrorAccesoDenegado,
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { repositorioProductos, type ProductoDetalle, type ProductoResumen } from './repositorio';
import type { DatosCrearProducto, DatosActualizarProducto, FiltrosProductos } from './dto';

/**
 * Genera un slug único y amigable para URLs a partir del nombre del producto.
 * Pasos: pasa a minúsculas, elimina acentos (normalización NFD + eliminación
 * de marcas diacríticas), elimina cualquier carácter que no sea letra/número/espacio,
 * recorta espacios y los sustituye por guiones (colapsando guiones repetidos).
 * Finalmente añade un sufijo aleatorio hexadecimal de 6 caracteres para
 * garantizar la unicidad incluso si dos productos tienen el mismo nombre.
 * @param nombre Nombre del producto introducido por el diseñador.
 * @returns Slug único, p. ej. "camiseta-organica-a1b2c3".
 */
function generarSlug(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  const sufijo = crypto.randomBytes(3).toString('hex');
  return `${base}-${sufijo}`;
}

export const servicioProductos = {
  /**
   * Devuelve el listado público y paginado de productos activos según los
   * filtros indicados, añadiendo la información de paginación (página y límite)
   * a la respuesta del repositorio.
   * @param filtros Filtros de búsqueda y paginación validados.
   * @returns Productos de la página solicitada, total, página y límite aplicados.
   */
  async listar(
    filtros: FiltrosProductos,
  ): Promise<{ datos: ProductoResumen[]; total: number; pagina: number; limite: number }> {
    const resultado = await repositorioProductos.listar(filtros);
    return { ...resultado, pagina: filtros.pagina, limite: filtros.limite };
  },

  /**
   * Devuelve el catálogo completo (activos e inactivos) del diseñador autenticado.
   * @param disenadorId Identificador del diseñador.
   * @returns Lista de productos propios y su total.
   */
  async listarMios(disenadorId: string): Promise<{ datos: ProductoResumen[]; total: number }> {
    const datos = await repositorioProductos.listarDeDisenador(disenadorId);
    return { datos, total: datos.length };
  },

  /**
   * Detalle de una prenda propia (incluye descripción y prendas inactivas), para
   * precargar el formulario de edición del diseñador.
   * @param id Identificador del producto.
   * @param usuarioId Identificador del diseñador autenticado.
   * @returns El producto con su detalle completo.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async obtenerMia(id: string, usuarioId: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorId(id);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return producto;
  },

  /**
   * Obtiene el detalle público de un producto activo a partir de su slug.
   * @param slug Slug único del producto.
   * @returns El producto con su detalle completo.
   * @throws ErrorNoEncontrado si no existe un producto activo con ese slug.
   */
  async obtenerPorSlug(slug: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorSlug(slug);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    return producto;
  },

  /**
   * Crea un nuevo producto para el diseñador autenticado, generando
   * previamente un slug único a partir del nombre.
   * @param disenadorId Identificador del diseñador que crea el producto.
   * @param rol Rol del usuario autenticado; solo DISENADOR puede crear productos.
   * @param datos Datos validados de creación.
   * @returns El producto creado.
   * @throws ErrorAccesoDenegado si el usuario no tiene rol DISENADOR.
   */
  async crear(disenadorId: string, rol: Rol, datos: DatosCrearProducto): Promise<ProductoDetalle> {
    if (rol !== Rol.DISENADOR) {
      throw new ErrorAccesoDenegado('Solo los diseñadores pueden crear productos');
    }
    const slug = generarSlug(datos.nombre);
    return repositorioProductos.crear(disenadorId, datos, slug);
  },

  /**
   * Actualiza parcialmente un producto, comprobando previamente que el
   * usuario autenticado es su propietario.
   * @param id Identificador del producto a actualizar.
   * @param usuarioId Identificador del diseñador autenticado.
   * @param datos Campos a actualizar.
   * @returns El producto actualizado.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async actualizar(
    id: string,
    usuarioId: string,
    datos: DatosActualizarProducto,
  ): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorId(id);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioProductos.actualizar(id, datos);
  },

  /**
   * Desactiva (soft delete) un producto del diseñador autenticado.
   * @param id Identificador del producto.
   * @param usuarioId Identificador del diseñador autenticado.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   * @throws ErrorReglaDeNegocio si el producto ya estaba desactivado.
   */
  async eliminar(id: string, usuarioId: string): Promise<void> {
    const producto = await repositorioProductos.buscarPorId(id);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    if (!producto.activo) {
      throw new ErrorReglaDeNegocio('El producto ya está desactivado');
    }
    await repositorioProductos.eliminar(id);
  },

  /**
   * Para uso interno de variantes e imágenes: verifica que el producto existe
   * y pertenece al usuario autenticado, devolviéndolo si la comprobación es
   * correcta. Permite reutilizar esta validación de propiedad desde otros
   * módulos sin duplicar la lógica de autorización.
   * @param productoId Identificador del producto.
   * @param usuarioId Identificador del diseñador autenticado.
   * @returns El producto, si el usuario es su propietario.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al usuario autenticado.
   */
  async verificarPropietario(productoId: string, usuarioId: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return producto;
  },
};
