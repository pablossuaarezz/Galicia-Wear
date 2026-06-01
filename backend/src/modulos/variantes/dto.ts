import { z } from 'zod';
import { TallaPrenda } from '@prisma/client';

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
