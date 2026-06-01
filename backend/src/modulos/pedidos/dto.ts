import { z } from 'zod';
import { MetodoPago } from '@prisma/client';

export const dtoCrearPedido = z.object({
  direccionEnvioId: z.string().uuid('ID de dirección de envío no válido'),
  metodoPago: z.nativeEnum(MetodoPago),
  notas: z.string().trim().max(500).optional(),
});
export type DatosCrearPedido = z.infer<typeof dtoCrearPedido>;
