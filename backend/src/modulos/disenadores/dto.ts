import { z } from 'zod';
import { CiudadGallega } from '@prisma/client';

// IBAN: 2 letras + 2 dígitos + hasta 30 alfanuméricos (estándar ISO 13616)
const ibanSchema = z
  .string()
  .min(15, 'IBAN demasiado corto')
  .max(34, 'IBAN demasiado largo')
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Formato IBAN no válido')
  .transform((v) => v.toUpperCase().replace(/\s+/g, ''));

// Clientes como la app móvil envían el cuerpo con todos los campos (Gson serializa
// también los vacíos/nulos). Tratamos ''/null como "sin valor" para no romper la
// validación de los campos realmente opcionales.
const aOpcional = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), esquema.optional());

const urlOpcional = aOpcional(z.string().url('URL no válida'));

export const dtoSolicitarDisenador = z.object({
  nombreMarca: z.string().trim().min(2, 'Nombre de marca muy corto').max(100),
  biografia: z.string().trim().min(10, 'Biografía muy corta').max(2000),
  ciudad: z.nativeEnum(CiudadGallega),
  iban: ibanSchema,
  urlLogo: urlOpcional,
  urlWeb: urlOpcional,
});
export type DatosSolicitarDisenador = z.infer<typeof dtoSolicitarDisenador>;

export const dtoActualizarDisenador = z
  .object({
    nombreMarca: z.string().trim().min(2).max(100).optional(),
    biografia: z.string().trim().min(10).max(2000).optional(),
    ciudad: z.nativeEnum(CiudadGallega).optional(),
    // En edición el IBAN no se reenvía si no se cambia: '' equivale a "sin cambio".
    iban: aOpcional(ibanSchema),
    urlLogo: urlOpcional,
    urlWeb: urlOpcional,
  })
  .strict();
export type DatosActualizarDisenador = z.infer<typeof dtoActualizarDisenador>;

export const dtoFiltrosDisenadores = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  ciudad: z.nativeEnum(CiudadGallega).optional(),
});
export type FiltrosDisenadores = z.infer<typeof dtoFiltrosDisenadores>;

export const dtoValidarDisenador = z.object({
  aprobar: z.boolean(),
});
export type DatosValidarDisenador = z.infer<typeof dtoValidarDisenador>;
