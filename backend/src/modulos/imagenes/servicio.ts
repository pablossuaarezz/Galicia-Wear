// Capa de servicio (lógica de negocio) del módulo de imágenes de producto.
// Aplica las comprobaciones de existencia (producto e imagen) y de propiedad:
// solo el diseñador propietario del producto puede crear, modificar, marcar
// como principal o eliminar sus imágenes. El listado, en cambio, es de
// acceso público (catálogo).
import { ImagenProducto } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioProductos } from '../productos/repositorio';
import { repositorioImagenes } from './repositorio';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

export const servicioImagenes = {
  /**
   * Lista las imágenes de un producto (operación pública, sin restricciones de propiedad).
   * @param productoId id del producto.
   * @returns array de imágenes del producto, ordenadas para su visualización.
   */
  async listar(productoId: string): Promise<ImagenProducto[]> {
    return repositorioImagenes.listarDeProducto(productoId);
  },

  /**
   * Crea una nueva imagen para un producto, comprobando que el producto exista
   * y que pertenezca al diseñador autenticado.
   * @param productoId id del producto al que se añade la imagen.
   * @param disenadorId id del diseñador autenticado que realiza la operación.
   * @param datos datos de la imagen (URL o derivada de base64) ya validados.
   * @returns la imagen creada.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async crear(
    productoId: string,
    disenadorId: string,
    datos: DatosCrearImagen,
  ): Promise<ImagenProducto> {
    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    // Comprobación de propiedad: solo el diseñador dueño del producto puede
    // añadirle imágenes.
    if (producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioImagenes.crear(productoId, datos);
  },

  /**
   * Actualiza los metadatos de una imagen (texto alternativo, posición),
   * comprobando que la imagen pertenezca al producto indicado y que el
   * producto pertenezca al diseñador autenticado.
   * @param id id de la imagen a actualizar.
   * @param productoId id del producto al que debería pertenecer la imagen.
   * @param disenadorId id del diseñador autenticado que realiza la operación.
   * @param datos campos a actualizar (todos opcionales).
   * @returns la imagen actualizada.
   * @throws ErrorNoEncontrado si la imagen no existe o no pertenece al producto indicado.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async actualizar(
    id: string,
    productoId: string,
    disenadorId: string,
    datos: DatosActualizarImagen,
  ): Promise<ImagenProducto> {
    const imagen = await repositorioImagenes.buscarPorId(id);
    // Se verifica tanto la existencia de la imagen como que realmente
    // pertenezca al producto indicado en la ruta (evita editar imágenes de
    // otro producto usando un id de imagen válido pero ajeno).
    if (!imagen || imagen.productoId !== productoId) throw new ErrorNoEncontrado('Imagen');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioImagenes.actualizar(id, datos);
  },

  /**
   * Marca una imagen como principal del producto, comprobando previamente
   * la pertenencia de la imagen al producto y la propiedad del producto por
   * parte del diseñador autenticado.
   * @param id id de la imagen a marcar como principal.
   * @param productoId id del producto al que debería pertenecer la imagen.
   * @param disenadorId id del diseñador autenticado que realiza la operación.
   * @returns la imagen marcada como principal.
   * @throws ErrorNoEncontrado si la imagen no existe o no pertenece al producto indicado.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async marcarPrincipal(
    id: string,
    productoId: string,
    disenadorId: string,
  ): Promise<ImagenProducto> {
    const imagen = await repositorioImagenes.buscarPorId(id);
    if (!imagen || imagen.productoId !== productoId) throw new ErrorNoEncontrado('Imagen');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioImagenes.marcarPrincipal(id, productoId);
  },

  /**
   * Elimina una imagen de un producto, comprobando previamente la pertenencia
   * de la imagen al producto y la propiedad del producto por parte del
   * diseñador autenticado.
   * @param id id de la imagen a eliminar.
   * @param productoId id del producto al que debería pertenecer la imagen.
   * @param disenadorId id del diseñador autenticado que realiza la operación.
   * @throws ErrorNoEncontrado si la imagen no existe o no pertenece al producto indicado.
   * @throws ErrorAccesoDenegado si el producto no pertenece al diseñador autenticado.
   */
  async eliminar(id: string, productoId: string, disenadorId: string): Promise<void> {
    const imagen = await repositorioImagenes.buscarPorId(id);
    if (!imagen || imagen.productoId !== productoId) throw new ErrorNoEncontrado('Imagen');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    await repositorioImagenes.eliminar(id);
  },
};
