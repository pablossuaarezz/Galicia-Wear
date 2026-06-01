import { z } from 'zod';

export const dtoCrearImagen = z.object({
  // Fase 2c: stub con URL directa. En Fase 6 se integra subida de archivos real.
  url: z.string().url('URL de imagen no válida').max(2048),
  textoAlternativo: z.string().trim().max(200).optional(),
  posicion: z.number().int().min(0).default(0),
  esPrincipal: z.boolean().default(false),
});
export type DatosCrearImagen = z.infer<typeof dtoCrearImagen>;

export const dtoActualizarImagen = z
  .object({
    textoAlternativo: z.string().trim().max(200).optional().nullable(),
    posicion: z.number().int().min(0).optional(),
  })
  .strict();
export type DatosActualizarImagen = z.infer<typeof dtoActualizarImagen>;
