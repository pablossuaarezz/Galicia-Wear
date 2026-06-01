import { ImagenProducto } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

export class RepositorioImagenes extends RepositorioBase<ImagenProducto> {
  async buscarPorId(id: string): Promise<ImagenProducto | null> {
    return this.bd.imagenProducto.findUnique({ where: { id } });
  }

  async listarDeProducto(productoId: string): Promise<ImagenProducto[]> {
    return this.bd.imagenProducto.findMany({
      where: { productoId },
      orderBy: [{ esPrincipal: 'desc' }, { posicion: 'asc' }],
    });
  }

  async crear(productoId: string, datos: DatosCrearImagen): Promise<ImagenProducto> {
    return this.bd.imagenProducto.create({
      data: {
        productoId,
        url: datos.url,
        textoAlternativo: datos.textoAlternativo ?? null,
        posicion: datos.posicion ?? 0,
        esPrincipal: datos.esPrincipal ?? false,
      },
    });
  }

  async actualizar(id: string, datos: DatosActualizarImagen): Promise<ImagenProducto> {
    return this.bd.imagenProducto.update({
      where: { id },
      data: {
        ...(datos.textoAlternativo !== undefined && { textoAlternativo: datos.textoAlternativo }),
        ...(datos.posicion !== undefined && { posicion: datos.posicion }),
      },
    });
  }

  async marcarPrincipal(id: string, productoId: string): Promise<ImagenProducto> {
    return this.bd.$transaction(async (tx) => {
      await tx.imagenProducto.updateMany({
        where: { productoId, id: { not: id } },
        data: { esPrincipal: false },
      });
      return tx.imagenProducto.update({
        where: { id },
        data: { esPrincipal: true },
      });
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.imagenProducto.delete({ where: { id } });
  }
}

export const repositorioImagenes = new RepositorioImagenes();
