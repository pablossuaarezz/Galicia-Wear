// DTOs (Data Transfer Objects) de validación para el módulo de pedidos.
// Definen, mediante esquemas Zod, la forma y restricciones de los datos
// que llegan en el cuerpo de las peticiones HTTP relacionadas con pedidos.

import { z } from 'zod';
import { MetodoPago } from '@prisma/client';

/**
 * Esquema de validación para el checkout (creación de un pedido a partir del carrito).
 * - `direccionEnvioId`: debe ser un UUID válido que identifique una dirección del cliente.
 * - `metodoPago`: debe coincidir con uno de los valores del enum `MetodoPago` de Prisma.
 * - `notas`: comentario opcional del cliente para el pedido, limitado a 500 caracteres.
 */
export const dtoCrearPedido = z.object({
  direccionEnvioId: z.string().uuid('ID de dirección de envío no válido'),
  metodoPago: z.nativeEnum(MetodoPago),
  notas: z.string().trim().max(500).optional(),
});
// Tipo TypeScript inferido automáticamente a partir del esquema Zod anterior.
export type DatosCrearPedido = z.infer<typeof dtoCrearPedido>;
