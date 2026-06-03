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
  async listar(
    filtros: FiltrosProductos,
  ): Promise<{ datos: ProductoResumen[]; total: number; pagina: number; limite: number }> {
    const resultado = await repositorioProductos.listar(filtros);
    return { ...resultado, pagina: filtros.pagina, limite: filtros.limite };
  },

  async listarMios(disenadorId: string): Promise<{ datos: ProductoResumen[]; total: number }> {
    const datos = await repositorioProductos.listarDeDisenador(disenadorId);
    return { datos, total: datos.length };
  },

  // Detalle de una prenda propia (incluye descripción y prendas inactivas), para
  // precargar el formulario de edición del diseñador.
  async obtenerMia(id: string, usuarioId: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorId(id);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return producto;
  },

  async obtenerPorSlug(slug: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorSlug(slug);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    return producto;
  },

  async crear(disenadorId: string, rol: Rol, datos: DatosCrearProducto): Promise<ProductoDetalle> {
    if (rol !== Rol.DISENADOR) {
      throw new ErrorAccesoDenegado('Solo los diseñadores pueden crear productos');
    }
    const slug = generarSlug(datos.nombre);
    return repositorioProductos.crear(disenadorId, datos, slug);
  },

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

  // Para uso interno de variantes e imágenes: verificar propiedad sin devolver el producto
  async verificarPropietario(productoId: string, usuarioId: string): Promise<ProductoDetalle> {
    const producto = await repositorioProductos.buscarPorId(productoId);
    if (!producto) throw new ErrorNoEncontrado('Producto');
    if (producto.disenadorId !== usuarioId) {
      throw new ErrorAccesoDenegado('No eres el propietario de este producto');
    }
    return producto;
  },
};
