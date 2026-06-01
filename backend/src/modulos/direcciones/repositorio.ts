import { Direccion } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

export class RepositorioDirecciones extends RepositorioBase<Direccion> {
  async buscarPorId(id: string): Promise<Direccion | null> {
    return this.bd.direccion.findUnique({ where: { id } });
  }

  async listarDeUsuario(usuarioId: string): Promise<Direccion[]> {
    return this.bd.direccion.findMany({
      where: { usuarioId },
      orderBy: [{ esPrincipal: 'desc' }, { alias: 'asc' }],
    });
  }

  async crear(usuarioId: string, datos: DatosCrearDireccion): Promise<Direccion> {
    return this.bd.direccion.create({
      data: {
        usuarioId,
        alias: datos.alias,
        linea1: datos.linea1,
        linea2: datos.linea2 ?? null,
        ciudad: datos.ciudad,
        codigoPostal: datos.codigoPostal,
        provincia: datos.provincia ?? 'A Coruña',
        pais: datos.pais ?? 'ES',
      },
    });
  }

  async actualizar(id: string, datos: DatosActualizarDireccion): Promise<Direccion> {
    return this.bd.direccion.update({
      where: { id },
      data: {
        ...(datos.alias !== undefined && { alias: datos.alias }),
        ...(datos.linea1 !== undefined && { linea1: datos.linea1 }),
        ...(datos.linea2 !== undefined && { linea2: datos.linea2 }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad }),
        ...(datos.codigoPostal !== undefined && { codigoPostal: datos.codigoPostal }),
        ...(datos.provincia !== undefined && { provincia: datos.provincia }),
        ...(datos.pais !== undefined && { pais: datos.pais }),
      },
    });
  }

  async marcarPrincipal(id: string, usuarioId: string): Promise<Direccion> {
    // Transacción: quitar principal de todas, poner en la elegida, actualizar cliente.
    return this.bd.$transaction(async (tx) => {
      await tx.direccion.updateMany({
        where: { usuarioId, id: { not: id } },
        data: { esPrincipal: false },
      });
      await tx.cliente.update({
        where: { usuarioId },
        data: { direccionPredeterminadaId: id },
      });
      return tx.direccion.update({
        where: { id },
        data: { esPrincipal: true },
      });
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.direccion.delete({ where: { id } });
  }
}

export const repositorioDirecciones = new RepositorioDirecciones();
