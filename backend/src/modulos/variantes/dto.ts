// DTOs (Data Transfer Objects) de validación para el módulo de variantes.
// Definen, mediante esquemas Zod, la forma y restricciones de los datos
// de creación/actualización de variantes (combinaciones talla/color/SKU/stock)
// de un producto.

import { z } from 'zod';
import { TallaPrenda } from '@prisma/client';

/**
 * Esquema de validación para crear una nueva variante de producto.
 * - `talla`: debe ser uno de los valores del enum `TallaPrenda` de Prisma.
 * - `color`: nombre del color, obligatorio.
 * - `sku`: código identificativo único; solo letras, números, guiones y
 *   guiones bajos (la validación es case-insensitive con el flag `i`, ya que
 *   el repositorio normaliza el SKU a mayúsculas).
 * - `stock`: cantidad disponible, no negativa, por defecto 0.
 * - `ajustePrecio`: incremento/decremento sobre el precio base del producto,
 *   con precisión de céntimos (`multipleOf(0.01)`), por defecto 0.
 */
export const dtoCrearVariante = z.object({
  talla: z.nativeEnum(TallaPrenda),
  color: z.string().trim().min(1, 'Color obligatorio').max(50),
  sku: z
    .string()
    .trim()
    .min(3, 'SKU mínimo 3 caracteres')
    .max(50)
    .regex(/^[A-Z0-9\-_]+$/i, 'SKU solo puede contener letras, números, guiones y guiones bajos'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  ajustePrecio: z.number().multipleOf(0.01).default(0),
});
export type DatosCrearVariante = z.infer<typeof dtoCrearVariante>;

/**
 * Esquema de validación para actualizar (PATCH) una variante existente.
 * Todos los campos son opcionales (actualización parcial) y se aplica
 * `.strict()` para rechazar cualquier campo no reconocido en el cuerpo
 * de la petición.
 */
export const dtoActualizarVariante = z
  .object({
    talla: z.nativeEnum(TallaPrenda).optional(),
    color: z.string().trim().min(1).max(50).optional(),
    sku: z.string().trim().min(3).max(50).regex(/^[A-Z0-9\-_]+$/i).optional(),
    stock: z.number().int().min(0).optional(),
    ajustePrecio: z.number().multipleOf(0.01).optional(),
  })
  .strict();
export type DatosActualizarVariante = z.infer<typeof dtoActualizarVariante>;
