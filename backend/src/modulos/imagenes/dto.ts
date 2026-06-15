// Esquemas de validación (zod) y tipos derivados para el módulo de imágenes
// de producto. Define los DTO de entrada para crear una imagen (vía URL o
// base64) y para actualizar sus metadatos (texto alternativo, posición).
import { z } from 'zod';

/**
 * DTO para la creación de una imagen de producto.
 * - url: URL directa de la imagen (usada por catálogos/semillas de datos), opcional.
 * - base64: imagen embebida como data URI (subida desde la app móvil/web), opcional.
 *   Limitada a 8.000.000 de caracteres (~8 MB) para evitar payloads excesivos.
 * - textoAlternativo: texto accesible (atributo alt) para la imagen, opcional.
 * - posicion: orden de la imagen dentro de la galería del producto (por defecto 0).
 * - esPrincipal: si esta imagen debe mostrarse como principal (por defecto false).
 *
 * `.refine` obliga a que se proporcione al menos uno de los dos campos `url`
 * o `base64`: una imagen no puede crearse sin contenido ni referencia.
 */
export const dtoCrearImagen = z
  .object({
    // Se acepta una URL directa (catálogo/seed) o una imagen base64 (data URI)
    // subida desde la app, que el backend guarda como archivo. Uno de los dos.
    url: z.string().url('URL de imagen no válida').max(2048).optional().nullable(),
    base64: z
      .string()
      // Valida que el string comience con el prefijo típico de un data URI de
      // imagen (p. ej. "data:image/png;base64,...").
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

/**
 * DTO para la actualización de metadatos de una imagen existente.
 * Solo permite modificar `textoAlternativo` y `posicion`; no se puede cambiar
 * la URL ni el flag `esPrincipal` por esta vía (existe un endpoint dedicado
 * para marcar como principal). `.strict()` rechaza campos no contemplados.
 */
export const dtoActualizarImagen = z
  .object({
    textoAlternativo: z.string().trim().max(200).optional().nullable(),
    posicion: z.number().int().min(0).optional(),
  })
  .strict();
export type DatosActualizarImagen = z.infer<typeof dtoActualizarImagen>;
