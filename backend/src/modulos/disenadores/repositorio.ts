import { Prisma, CiudadGallega } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import { cifrarTexto } from '../../utilidades/cifrado';
import type { DatosSolicitarDisenador, DatosActualizarDisenador, FiltrosDisenadores } from './dto';

// ibanCifrado se omite intencionadamente de todas las respuestas públicas.
const seleccionPublica = {
  usuarioId: true,
  nombreMarca: true,
  biografia: true,
  ciudad: true,
  validado: true,
  fechaValidacion: true,
  validadoPorId: true,
  urlLogo: true,
  urlWeb: true,
  fechaCreacion: true,
} as const;

export type DisenadorPublico = Prisma.DisenadorGetPayload<{ select: typeof seleccionPublica }>;

export class RepositorioDisenadores extends RepositorioBase<DisenadorPublico> {
  async buscarPorId(id: string): Promise<DisenadorPublico | null> {
    return this.bd.disenador.findUnique({
      where: { usuarioId: id },
      select: seleccionPublica,
    });
  }

  async listar(
    filtros: FiltrosDisenadores,
  ): Promise<{ datos: DisenadorPublico[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;
    const condicion: Prisma.DisenadorWhereInput = {
      validado: true,
      ...(filtros.ciudad && { ciudad: filtros.ciudad }),
    };

    const [datos, total] = await Promise.all([
      this.bd.disenador.findMany({
        where: condicion,
        select: seleccionPublica,
        orderBy: { nombreMarca: 'asc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.disenador.count({ where: condicion }),
    ]);

    return { datos, total };
  }

  // Listado para el panel admin: permite incluir diseñadores aún no validados
  // (el listado público fuerza validado:true; aquí el filtro es opcional).
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    ciudad?: CiudadGallega;
    validado?: boolean;
  }): Promise<{ datos: DisenadorPublico[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;
    const condicion: Prisma.DisenadorWhereInput = {
      ...(filtros.validado !== undefined && { validado: filtros.validado }),
      ...(filtros.ciudad && { ciudad: filtros.ciudad }),
    };

    const [datos, total] = await Promise.all([
      this.bd.disenador.findMany({
        where: condicion,
        select: seleccionPublica,
        orderBy: { fechaCreacion: 'desc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.disenador.count({ where: condicion }),
    ]);

    return { datos, total };
  }

  async crear(usuarioId: string, datos: DatosSolicitarDisenador): Promise<DisenadorPublico> {
    return this.bd.disenador.create({
      data: {
        usuarioId,
        nombreMarca: datos.nombreMarca,
        biografia: datos.biografia,
        ciudad: datos.ciudad,
        ibanCifrado: cifrarTexto(datos.iban),
        urlLogo: datos.urlLogo ?? null,
        urlWeb: datos.urlWeb ?? null,
      },
      select: seleccionPublica,
    });
  }

  async actualizar(
    usuarioId: string,
    datos: DatosActualizarDisenador,
  ): Promise<DisenadorPublico> {
    return this.bd.disenador.update({
      where: { usuarioId },
      data: {
        ...(datos.nombreMarca !== undefined && { nombreMarca: datos.nombreMarca }),
        ...(datos.biografia !== undefined && { biografia: datos.biografia }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad }),
        ...(datos.iban !== undefined && { ibanCifrado: cifrarTexto(datos.iban) }),
        ...(datos.urlLogo !== undefined && { urlLogo: datos.urlLogo }),
        ...(datos.urlWeb !== undefined && { urlWeb: datos.urlWeb }),
      },
      select: seleccionPublica,
    });
  }

  async validar(
    usuarioId: string,
    validadoPorId: string,
    aprobar: boolean,
  ): Promise<DisenadorPublico> {
    return this.bd.disenador.update({
      where: { usuarioId },
      data: {
        validado: aprobar,
        fechaValidacion: aprobar ? new Date() : null,
        validadoPorId: aprobar ? validadoPorId : null,
      },
      select: seleccionPublica,
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.disenador.delete({ where: { usuarioId: id } });
  }
}

export const repositorioDisenadores = new RepositorioDisenadores();
