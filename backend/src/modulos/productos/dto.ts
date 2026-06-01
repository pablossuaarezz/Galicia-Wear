import { z } from 'zod';
import { MaterialPrincipal, CiudadGallega, CodigoCertificado } from '@prisma/client';

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
