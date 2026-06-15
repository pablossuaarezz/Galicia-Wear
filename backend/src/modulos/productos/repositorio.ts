// Repositorio del módulo de productos: encapsula el acceso a datos (Prisma)
// para la entidad Producto, incluyendo sus relaciones con diseñador,
// variantes, imágenes y certificados. Expone tanto el listado público
// (solo productos activos, con filtros de sostenibilidad) como los
// listados de gestión para el diseñador propietario y el panel admin.

import { Prisma, MaterialPrincipal, CiudadGallega, CodigoCertificado, TallaPrenda } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearProducto, DatosActualizarProducto, FiltrosProductos } from './dto';

// ---- Tipos exportados (construidos manualmente para evitar complejidad con `as const`) ----

/** Datos resumidos del diseñador que se muestran junto a cada producto. */
export interface DisenadorResumen {
  nombreMarca: string;
  ciudad: CiudadGallega;
  urlLogo: string | null;
}

/**
 * Forma resumida de un producto, usada en los listados (catálogo público,
 * "mis productos" del diseñador y panel admin). Incluye solo la imagen
 * principal y los certificados asociados, sin descripción completa ni variantes.
 */
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

/** Datos de una variante (talla/color/sku/stock) tal como se muestran en el detalle del producto. */
export interface VarianteResumen {
  id: string;
  talla: TallaPrenda;
  color: string;
  sku: string;
  stock: number;
  ajustePrecio: Prisma.Decimal;
}

/** Datos de una imagen del producto, incluyendo su orden de presentación y si es la principal. */
export interface ImagenResumen {
  id: string;
  url: string;
  textoAlternativo: string | null;
  posicion: number;
  esPrincipal: boolean;
}

/**
 * Forma completa de un producto (vista de detalle): extiende `ProductoResumen`
 * añadiendo la descripción completa, todas las variantes, todas las imágenes
 * (no solo la principal) y los certificados con sus metadatos completos.
 */
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
  /**
   * Busca un producto por su id, devolviendo su detalle completo
   * (incluye productos inactivos, ya que se usa para operaciones internas
   * de gestión, verificación de propiedad, etc.).
   * @param id Identificador del producto.
   * @returns El producto o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<ProductoDetalle | null> {
    return this.bd.producto.findUnique({
      where: { id },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle | null>;
  }

  /**
   * Busca un producto activo por su slug (usado en la vista pública de detalle).
   * @param slug Slug único del producto.
   * @returns El producto o `null` si no existe o está inactivo.
   */
  async buscarPorSlug(slug: string): Promise<ProductoDetalle | null> {
    return this.bd.producto.findUnique({
      where: { slug, activo: true },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle | null>;
  }

  /**
   * Listado público y paginado de productos activos, aplicando los filtros
   * de sostenibilidad (material, km de origen, ciudad del diseñador,
   * certificado) y una búsqueda de texto libre sobre nombre/descripción.
   * @param filtros Filtros y paginación validados (`FiltrosProductos`).
   * @returns Productos de la página solicitada y el total que cumple los filtros.
   */
  async listar(
    filtros: FiltrosProductos,
  ): Promise<{ datos: ProductoResumen[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;

    // Construcción dinámica de la condición `where`: el listado público
    // siempre fuerza `activo: true`, y cada filtro opcional se añade solo
    // si el usuario lo ha especificado (mediante spread condicional).
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

    // Se ejecutan en paralelo la consulta paginada y el conteo total para
    // poder construir la respuesta paginada con un solo "round trip" lógico.
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

  /**
   * Listado para el panel admin: incluye productos inactivos/retirados
   * (el listado público fuerza activo:true), con paginación, búsqueda de
   * texto y filtros opcionales por material o estado de actividad.
   * @param filtros Página, límite y filtros opcionales (búsqueda, material, activo).
   * @returns Productos de la página solicitada y el total que cumple los filtros.
   */
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    busqueda?: string;
    material?: MaterialPrincipal;
    activo?: boolean;
  }): Promise<{ datos: ProductoResumen[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;

    // A diferencia del listado público, aquí `activo` es opcional: si no se
    // especifica, se devuelven tanto productos activos como inactivos.
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

  /**
   * Listado de productos propios del diseñador autenticado: incluye los inactivos
   * (a diferencia del listado público), porque el diseñador debe gestionar todo su catálogo.
   * No está paginado: se asume que el catálogo de un diseñador es manejable en una sola página.
   * @param disenadorId Identificador del diseñador.
   * @returns Lista completa de productos propios (activos e inactivos).
   */
  async listarDeDisenador(disenadorId: string): Promise<ProductoResumen[]> {
    const datos = await this.bd.producto.findMany({
      where: { disenadorId },
      select: seleccionResumen,
      orderBy: { fechaCreacion: 'desc' },
    });
    return datos as unknown as ProductoResumen[];
  }

  /**
   * Crea un nuevo producto asociado al diseñador indicado.
   * @param disenadorId Identificador del diseñador propietario.
   * @param datos Datos validados de creación (`DatosCrearProducto`).
   * @param slug Slug único ya generado por el servicio para este producto.
   * @returns El producto creado con su detalle completo.
   */
  async crear(disenadorId: string, datos: DatosCrearProducto, slug: string): Promise<ProductoDetalle> {
    return this.bd.producto.create({
      data: {
        disenadorId,
        nombre: datos.nombre,
        slug,
        descripcion: datos.descripcion,
        precioBase: datos.precioBase,
        // Si `kmOrigen` no llega (aunque el DTO ya pone un valor por defecto), se usa 0.
        kmOrigen: datos.kmOrigen ?? 0,
        materialPrincipal: datos.materialPrincipal,
      },
      select: seleccionDetalle,
    }) as Promise<ProductoDetalle>;
  }

  /**
   * Actualiza parcialmente un producto existente. Solo se incluyen en la
   * operación `update` los campos que llegan definidos en `datos`
   * (actualización parcial real, evitando sobrescribir campos no enviados con `undefined`).
   * @param id Identificador del producto.
   * @param datos Campos a actualizar (`DatosActualizarProducto`).
   * @returns El producto actualizado con su detalle completo.
   */
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

  /**
   * Elimina (lógicamente) un producto. Para preservar el histórico de pedidos
   * y la integridad referencial, no se borra el registro: se marca como inactivo.
   * @param id Identificador del producto a desactivar.
   */
  async eliminar(id: string): Promise<void> {
    // Soft delete: desactiva el producto
    await this.bd.producto.update({ where: { id }, data: { activo: false } });
  }
}

// Instancia única (singleton) del repositorio, usada por el servicio de productos.
export const repositorioProductos = new RepositorioProductos();

// ---- Constantes de selección ----

// Objeto `select` de Prisma usado en los listados: trae solo la imagen
// principal (no todas) y los datos mínimos de diseñador y certificados,
// para mantener ligera la respuesta de los listados.
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

// Objeto `select` de Prisma usado en las vistas de detalle: incluye la
// descripción completa, todas las variantes (ordenadas por talla y color),
// todas las imágenes (ordenadas para mostrar primero la principal) y los
// certificados con todos sus metadatos.
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
