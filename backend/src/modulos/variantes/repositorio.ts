import { Variante } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export class RepositorioVariantes extends RepositorioBase<Variante> {
  async buscarPorId(id: string): Promise<Variante | null> {
    return this.bd.variante.findUnique({ where: { id } });
  }

  async listarDeProducto(productoId: string): Promise<Variante[]> {
    return this.bd.variante.findMany({
      where: { productoId },
      orderBy: [{ talla: 'asc' }, { color: 'asc' }],
    });
  }

  async crear(productoId: string, datos: DatosCrearVariante): Promise<Variante> {
    return this.bd.variante.create({
      data: {
        productoId,
        talla: datos.talla,
        color: datos.color,
        sku: datos.sku.toUpperCase(),
        stock: datos.stock ?? 0,
        ajustePrecio: datos.ajustePrecio ?? 0,
      },
    });
  }

  async actualizar(id: string, datos: DatosActualizarVariante): Promise<Variante> {
    return this.bd.variante.update({
      where: { id },
      data: {
        ...(datos.talla !== undefined && { talla: datos.talla }),
        ...(datos.color !== undefined && { color: datos.color }),
        ...(datos.sku !== undefined && { sku: datos.sku.toUpperCase() }),
        ...(datos.stock !== undefined && { stock: datos.stock }),
        ...(datos.ajustePrecio !== undefined && { ajustePrecio: datos.ajustePrecio }),
      },
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.variante.delete({ where: { id } });
  }
}

export const repositorioVariantes = new RepositorioVariantes();
