import { z } from 'zod';

export const dtoCrearImagen = z
  .object({
    // Se acepta una URL directa (catálogo/seed) o una imagen base64 (data URI)
    // subida desde la app, que el backend guarda como archivo. Uno de los dos.
    url: z.string().url('URL de imagen no válida').max(2048).optional().nullable(),
    base64: z
      .string()
      .regex(/^data:image\/[a-zA-Z+]+;base64,/, 'Imagen base64 no válida')
      .max(8_000_000, 'La imagen es demasiado grande')
      .optional()
      .nullable(),
    textoAlternativo: z.string().trim().max(200).optional().nullable(),
    posicion: z.number().int().min(0).default(0),
    esPrincipal: z.boolean().default(false),
  })
  .refine((d) => Boolean(d.url || d.base64), {
    message: 'Debes enviar una URL o una imagen',
  });
export type DatosCrearImagen = z.infer<typeof dtoCrearImagen>;

export const dtoActualizarImagen = z
  .object({
    textoAlternativo: z.string().trim().max(200).optional().nullable(),
    posicion: z.number().int().min(0).optional(),
  })
  .strict();
export type DatosActualizarImagen = z.infer<typeof dtoActualizarImagen>;
