import { Prisma, MaterialPrincipal, CiudadGallega, CodigoCertificado, TallaPrenda } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearProducto, DatosActualizarProducto, FiltrosProductos } from './dto';

// ---- Tipos exportados (construidos manualmente para evitar complejidad con `as const`) ----

export interface DisenadorResumen {
  nombreMarca: string;
  ciudad: CiudadGallega;
  urlLogo: string | null;
}

export interface ProductoResumen {
  id: string;
  disenadorId: string;
  nombre: string;
  slug: string;
  precioBase: Prisma.Decimal;
  kmOrigen: number;
  materialPrincipal: MaterialPrincipal;
  activo: boolean;
  fechaCreacion: Date;
  disenador: DisenadorResumen;
  imagenes: Array<{ url: string; textoAlternativo: string | null }>;
  certificados: Array<{ certificado: { codigo: CodigoCertificado; nombre: string } }>;
}

export interface VarianteResumen {
  id: string;
  talla: TallaPrenda;
  color: string;
  sku: string;
  stock: number;
  ajustePrecio: Prisma.Decimal;
}

export interface ImagenResumen {
  id: string;
  url: string;
  textoAlternativo: string | null;
  posicion: number;
  esPrincipal: boolean;
}

export interface ProductoDetalle extends ProductoResumen {
  descripcion: string;
  fechaActualizacion: Date;
  disenador: DisenadorResumen & { urlWeb: string | null };
  variantes: VarianteResumen[];
  imagenes: ImagenResumen[];
  certificados: Array<{
    numeroCertificado: string;
    fechaEmision: Date;
    fechaExpiracion: Date | null;
    certificado: { codigo: CodigoCertificado; nombre: string; urlEmisor: string };
  }>;
}

// ---- Repositorio ----

export class RepositorioProductos extends RepositorioBase<ProductoDetalle> {
  async buscarPorId(id: string): Promise<ProductoDetalle | null> {
    return this.bd.producto.findUnique({
      where: { id },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle | null>;
  }

  async buscarPorSlug(slug: string): Promise<ProductoDetalle | null> {
    return this.bd.producto.findUnique({
      where: { slug, activo: true },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle | null>;
  }

  async listar(
    filtros: FiltrosProductos,
  ): Promise<{ datos: ProductoResumen[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;

    const condicion: Prisma.ProductoWhereInput = {
      activo: true,
      ...(filtros.material && { materialPrincipal: filtros.material }),
      ...(filtros.maxKm !== undefined && { kmOrigen: { lte: filtros.maxKm } }),
      ...(filtros.ciudad && { disenador: { ciudad: filtros.ciudad } }),
      ...(filtros.certificado && {
        certificados: { some: { certificado: { codigo: filtros.certificado } } },
      }),
      ...(filtros.busqueda && {
        // En MySQL la colación por defecto (utf8mb4_*_ci) ya es case-insensitive,
        // por lo que `contains` no admite ni necesita `mode: 'insensitive'`.
        OR: [
          { nombre: { contains: filtros.busqueda } },
          { descripcion: { contains: filtros.busqueda } },
        ],
      }),
    };

    const [datos, total] = await Promise.all([
      this.bd.producto.findMany({
        where: condicion,
        select: seleccionResumen,
        orderBy: { fechaCreacion: 'desc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.producto.count({ where: condicion }),
    ]);

    return { datos: datos as unknown as ProductoResumen[], total };
  }

  // Listado para el panel admin: incluye productos inactivos/retirados
  // (el listado público fuerza activo:true).
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    busqueda?: string;
    material?: MaterialPrincipal;
    activo?: boolean;
  }): Promise<{ datos: ProductoResumen[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;

    const condicion: Prisma.ProductoWhereInput = {
      ...(filtros.activo !== undefined && { activo: filtros.activo }),
      ...(filtros.material && { materialPrincipal: filtros.material }),
      ...(filtros.busqueda && {
        OR: [
          { nombre: { contains: filtros.busqueda } },
          { descripcion: { contains: filtros.busqueda } },
        ],
      }),
    };

    const [datos, total] = await Promise.all([
      this.bd.producto.findMany({
        where: condicion,
        select: seleccionResumen,
        orderBy: { fechaCreacion: 'desc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.producto.count({ where: condicion }),
    ]);

    return { datos: datos as unknown as ProductoResumen[], total };
  }

  async crear(disenadorId: string, datos: DatosCrearProducto, slug: string): Promise<ProductoDetalle> {
    return this.bd.producto.create({
      data: {
        disenadorId,
        nombre: datos.nombre,
        slug,
        descripcion: datos.descripcion,
        precioBase: datos.precioBase,
        kmOrigen: datos.kmOrigen ?? 0,
        materialPrincipal: datos.materialPrincipal,
      },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle>;
  }

  async actualizar(id: string, datos: DatosActualizarProducto): Promise<ProductoDetalle> {
    return this.bd.producto.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(datos.precioBase !== undefined && { precioBase: datos.precioBase }),
        ...(datos.kmOrigen !== undefined && { kmOrigen: datos.kmOrigen }),
        ...(datos.materialPrincipal !== undefined && { materialPrincipal: datos.materialPrincipal }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle>;
  }

  async eliminar(id: string): Promise<void> {
    // Soft delete: desactiva el producto
    await this.bd.producto.update({ where: { id }, data: { activo: false } });
  }
}

export const repositorioProductos = new RepositorioProductos();

// ---- Constantes de selección ----

const seleccionResumen = {
  id: true,
  disenadorId: true,
  nombre: true,
  slug: true,
  precioBase: true,
  kmOrigen: true,
  materialPrincipal: true,
  activo: true,
  fechaCreacion: true,
  disenador: { select: { nombreMarca: true, ciudad: true, urlLogo: true } },
  imagenes: {
    where: { esPrincipal: true },
    take: 1,
    select: { url: true, textoAlternativo: true },
  },
  certificados: {
    select: { certificado: { select: { codigo: true, nombre: true } } },
  },
};

const seleccionDetalle = {
  id: true,
  disenadorId: true,
  nombre: true,
  slug: true,
  descripcion: true,
  precioBase: true,
  kmOrigen: true,
  materialPrincipal: true,
  activo: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  disenador: { select: { nombreMarca: true, ciudad: true, urlLogo: true, urlWeb: true } },
  variantes: {
    select: { id: true, talla: true, color: true, sku: true, stock: true, ajustePrecio: true },
    orderBy: [{ talla: Prisma.SortOrder.asc }, { color: Prisma.SortOrder.asc }],
  },
  imagenes: {
    select: { id: true, url: true, textoAlternativo: true, posicion: true, esPrincipal: true },
    orderBy: [{ esPrincipal: Prisma.SortOrder.desc }, { posicion: Prisma.SortOrder.asc }],
  },
  certificados: {
    select: {
      numeroCertificado: true,
      fechaEmision: true,
      fechaExpiracion: true,
      certificado: { select: { codigo: true, nombre: true, urlEmisor: true } },
    },
  },
};
