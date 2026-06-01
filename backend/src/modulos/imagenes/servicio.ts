import { ImagenProducto } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioProductos } from '../productos/repositorio';
import { repositorioImagenes } from './repositorio';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

export const servicioImagenes = {
  async listar(productoId: string): Promise<ImagenProducto[]> {
    return repositorioImagenes.listarDeProducto(productoId);
  },

  async crear(
    productoId: string,
    disenadorId: string,
    datos: DatosCrearImagen,
  ): Promise<ImagenProducto> {
    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioImagenes.crear(productoId, datos);
  },

  async actualizar(
    id: string,
    productoId: string,
    disenadorId: string,
    datos: DatosActualizarImagen,
  ): Promise<ImagenProducto> {
    const imagen = await repositorioImagenes.buscarPorId(id);
    if (!imagen || imagen.productoId !== productoId) throw new ErrorNoEncontrado('Imagen');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioImagenes.actualizar(id, datos);
  },

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
