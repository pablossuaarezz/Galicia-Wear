/**
 * DTOs (Data Transfer Objects) del módulo Carrito.
 *
 * Define los esquemas de validación con Zod para las peticiones de entrada
 * relacionadas con el carrito de la compra, junto con los tipos TypeScript
 * inferidos a partir de dichos esquemas. Estos esquemas son utilizados por el
 * middleware `validar` en las rutas para garantizar que los datos recibidos
 * cumplen el formato esperado antes de llegar al controlador.
 */
import { z } from 'zod';

/**
 * Esquema de validación para añadir o actualizar un artículo del carrito.
 * - `varianteId`: debe ser un UUID válido que identifique la variante de producto.
 * - `cantidad`: número entero entre 1 y 99 (límite razonable por artículo).
 */
export const dtoAgregarItem = z.object({
  varianteId: z.string().uuid('ID de variante no válido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(99, 'Máximo 99 unidades por artículo'),
});
/** Tipo inferido a partir de `dtoAgregarItem`, usado en el controlador y servicio. */
export type DatosAgregarItem = z.infer<typeof dtoAgregarItem>;
