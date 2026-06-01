import { Variante } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorConflicto, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioProductos } from '../productos/repositorio';
import { repositorioVariantes } from './repositorio';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export const servicioVariantes = {
  async listar(productoId: string): Promise<Variante[]> {
    return repositorioVariantes.listarDeProducto(productoId);
  },

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

  async actualizar(
    id: string,
    productoId: string,
    disenadorId: string,
    datos: DatosActualizarVariante,
  ): Promise<Variante> {
    const variante = await repositorioVariantes.buscarPorId(id);
    if (!variante || variante.productoId !== productoId) throw new ErrorNoEncontrado('Variante');

    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto || producto.disenadorId !== disenadorId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return repositorioVariantes.actualizar(id, datos);
  },

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
