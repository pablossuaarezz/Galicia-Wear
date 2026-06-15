// Servicio (capa de lógica de negocio) del módulo de variantes.
// Gestiona las combinaciones talla/color/SKU/stock de cada producto,
// comprobando en cada operación de escritura que la variante pertenece al
// producto indicado y que el usuario autenticado es el diseñador propietario
// de dicho producto (delegando el acceso a datos en los repositorios de
// variantes y productos).

import { Variante } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorConflicto, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioProductos } from '../productos/repositorio';
import { repositorioVariantes } from './repositorio';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export const servicioVariantes = {
  /**
   * Lista todas las variantes de un producto.
   * @param productoId Identificador del producto.
   * @returns Lista de variantes (ordenadas por talla y color).
   */
  async listar(productoId: string): Promise<Variante[]> {
    return repositorioVariantes.listarDeProducto(productoId);
  },

  /**
   * Crea una nueva variante para un producto, comprobando que el producto
   * existe y que pertenece al diseñador autenticado.
   * @param productoId Identificador del producto.
   * @param disenadorId Identificador del diseñador autenticado.
   * @param datos Datos validados de la nueva variante.
   * @returns La variante creada.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async crear(
    productoId: string,
    disenadorId: string,
    datos: DatosCrearVariante,
  ): Promise<Variante> {
    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioVariantes.crear(productoId, datos);
  },

  /**
   * Actualiza parcialmente una variante existente, comprobando que la
   * variante pertenece al producto indicado y que el producto pertenece
   * al diseñador autenticado.
   * @param id Identificador de la variante.
   * @param productoId Identificador del producto al que debería pertenecer la variante.
   * @param disenadorId Identificador del diseñador autenticado.
   * @param datos Campos a actualizar.
   * @returns La variante actualizada.
   * @throws ErrorNoEncontrado si la variante no existe o no pertenece al producto indicado.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async actualizar(
    id: string,
    productoId: string,
    disenadorId: string,
    datos: DatosActualizarVariante,
  ): Promise<Variante> {
    // Comprobación de "pertenencia": la variante debe existir Y pertenecer
    // al producto indicado en la URL (evita modificar variantes de otro producto).
    const variante = await repositorioVariantes.buscarPorId(id);
    if (!variante || variante.productoId !== productoId) throw new ErrorNoEncontrado('Variante');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioVariantes.actualizar(id, datos);
  },

  /**
   * Elimina una variante, comprobando que pertenece al producto indicado y
   * que el producto pertenece al diseñador autenticado.
   * @param id Identificador de la variante.
   * @param productoId Identificador del producto al que debería pertenecer la variante.
   * @param disenadorId Identificador del diseñador autenticado.
   * @throws ErrorNoEncontrado si la variante no existe o no pertenece al producto indicado.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async eliminar(id: string, productoId: string, disenadorId: string): Promise<void> {
    const variante = await repositorioVariantes.buscarPorId(id);
    if (!variante || variante.productoId !== productoId) throw new ErrorNoEncontrado('Variante');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    await repositorioVariantes.eliminar(id);
  },
};
