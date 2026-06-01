import { z } from 'zod';

export const dtoAgregarItem = z.object({
  varianteId: z.string().uuid('ID de variante no válido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(99, 'Máximo 99 unidades por artículo'),
});
export type DatosAgregarItem = z.infer<typeof dtoAgregarItem>;
