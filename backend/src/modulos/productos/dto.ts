// DTOs (Data Transfer Objects) de validación para el módulo de productos.
// Definen, mediante esquemas Zod, la forma y restricciones de los datos
// de creación/actualización de productos y de los filtros de búsqueda
// usados en el listado público del catálogo.

import { z } from 'zod';
import { MaterialPrincipal, CiudadGallega, CodigoCertificado } from '@prisma/client';

/**
 * Esquema de validación para crear un producto nuevo.
 * - `nombre`/`descripcion`: longitudes mínimas para evitar fichas vacías o pobres.
 * - `precioBase`: precio base de la prenda, obligatorio, positivo y con tope de 9999.99.
 * - `kmOrigen`: kilómetros de origen del producto (indicador de sostenibilidad/proximidad),
 *   por defecto 0 si no se especifica.
 * - `materialPrincipal`: debe ser uno de los valores del enum `MaterialPrincipal` de Prisma.
 */
export const dtoCrearProducto = z.object({
  nombre: z.string().trim().min(3, 'Nombre demasiado corto').max(120),
  descripcion: z.string().trim().min(20, 'Descripción demasiado corta').max(4000),
  precioBase: z
    .number({ required_error: 'precioBase es obligatorio' })
    .positive('El precio debe ser positivo')
    .max(9999.99, 'Precio máximo 9999.99'),
  kmOrigen: z.number().int().min(0).max(5000).default(0),
  materialPrincipal: z.nativeEnum(MaterialPrincipal),
});
export type DatosCrearProducto = z.infer<typeof dtoCrearProducto>;

/**
 * Esquema de validación para actualizar (PATCH) un producto existente.
 * Todos los campos son opcionales (actualización parcial) y se aplica
 * `.strict()` para rechazar cualquier campo no reconocido en el cuerpo
 * de la petición (evita actualizaciones accidentales o maliciosas de campos
 * no previstos, como `disenadorId`).
 */
export const dtoActualizarProducto = z
  .object({
    nombre: z.string().trim().min(3).max(120).optional(),
    descripcion: z.string().trim().min(20).max(4000).optional(),
    precioBase: z.number().positive().max(9999.99).optional(),
    kmOrigen: z.number().int().min(0).max(5000).optional(),
    materialPrincipal: z.nativeEnum(MaterialPrincipal).optional(),
    activo: z.boolean().optional(),
  })
  .strict();
export type DatosActualizarProducto = z.infer<typeof dtoActualizarProducto>;

/**
 * Esquema de validación para los parámetros de consulta (`query`) del
 * listado público de productos. Usa `z.coerce.number()` porque los query
 * params de Express llegan siempre como strings y deben convertirse a número.
 * - `pagina`/`limite`: paginación, con valores por defecto y límite máximo de 50 por página.
 * - `busqueda`: texto libre que se buscará en nombre y descripción.
 * - `material`/`ciudad`/`certificado`: filtros de sostenibilidad basados en enums de Prisma.
 * - `maxKm`: filtra productos cuyo `kmOrigen` sea menor o igual al indicado.
 */
export const dtoFiltrosProductos = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  busqueda: z.string().trim().max(100).optional(),
  material: z.nativeEnum(MaterialPrincipal).optional(),
  ciudad: z.nativeEnum(CiudadGallega).optional(),
  maxKm: z.coerce.number().int().min(0).max(5000).optional(),
  certificado: z.nativeEnum(CodigoCertificado).optional(),
});
export type FiltrosProductos = z.infer<typeof dtoFiltrosProductos>;
