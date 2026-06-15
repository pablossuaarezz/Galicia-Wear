// Esquemas de validación (zod) y tipos derivados para el módulo de diseñadores.
// Define los DTO de entrada para solicitar/actualizar un perfil de diseñador,
// los filtros de listado y el DTO de validación administrativa.
// Estos esquemas son la única puerta de entrada de datos externos: si no pasan
// la validación, la petición se rechaza antes de llegar al servicio.
import { z } from 'zod';
import { CiudadGallega } from '@prisma/client';

// IBAN: 2 letras + 2 dígitos + hasta 30 alfanuméricos (estándar ISO 13616)
/**
 * Esquema de validación de un IBAN.
 * Comprueba longitud y formato según ISO 13616, y normaliza el valor
 * pasándolo a mayúsculas y eliminando espacios (formatos habituales al copiar
 * un IBAN desde banca online suelen incluir espacios cada 4 caracteres).
 */
const ibanSchema = z
  .string()
  .min(15, 'IBAN demasiado corto')
  .max(34, 'IBAN demasiado largo')
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Formato IBAN no válido')
  .transform((v) => v.toUpperCase().replace(/\s+/g, ''));

// Clientes como la app móvil envían el cuerpo con todos los campos (Gson serializa
// también los vacíos/nulos). Tratamos ''/null como "sin valor" para no romper la
// validación de los campos realmente opcionales.
/**
 * Envuelve un esquema zod para que sea opcional y, además, trate las cadenas
 * vacías y los valores `null` como "ausente" (undefined) antes de validar.
 * Esto evita que clientes que serializan todos los campos (incluso los vacíos)
 * provoquen errores de validación en campos opcionales.
 * @param esquema esquema zod base a envolver.
 * @returns el mismo esquema, opcional y con preprocesado de valores vacíos.
 */
const aOpcional = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), esquema.optional());

// URL opcional reutilizada para campos de logo/web, aplicando el mismo
// tratamiento de "vacío equivale a ausente" descrito arriba.
const urlOpcional = aOpcional(z.string().url('URL no válida'));

/**
 * DTO para la solicitud de alta como diseñador.
 * Campos:
 * - nombreMarca: nombre comercial de la marca (2-100 caracteres).
 * - biografia: descripción de la marca (10-2000 caracteres).
 * - ciudad: ciudad gallega de origen (enum de Prisma).
 * - iban: cuenta bancaria para pagos, validada y normalizada.
 * - urlLogo / urlWeb: enlaces opcionales (logo de la marca y web propia).
 */
export const dtoSolicitarDisenador = z.object({
  nombreMarca: z.string().trim().min(2, 'Nombre de marca muy corto').max(100),
  biografia: z.string().trim().min(10, 'Biografía muy corta').max(2000),
  ciudad: z.nativeEnum(CiudadGallega),
  iban: ibanSchema,
  urlLogo: urlOpcional,
  urlWeb: urlOpcional,
});
export type DatosSolicitarDisenador = z.infer<typeof dtoSolicitarDisenador>;

/**
 * DTO para la actualización del perfil propio de un diseñador.
 * Todos los campos son opcionales (edición parcial / PATCH).
 * Se usa `.strict()` para rechazar cualquier campo no contemplado en el esquema,
 * evitando que el cliente cuele propiedades no soportadas (p. ej. `validado`).
 */
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

/**
 * DTO de filtros para el listado paginado de diseñadores (endpoint público).
 * - pagina / limite: paginación con valores por defecto (página 1, 20 por página, máx. 50).
 * - ciudad: filtro opcional por ciudad gallega.
 * `z.coerce.number()` permite recibir estos valores como strings desde la query string
 * y convertirlos automáticamente a número.
 */
export const dtoFiltrosDisenadores = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  ciudad: z.nativeEnum(CiudadGallega).optional(),
});
export type FiltrosDisenadores = z.infer<typeof dtoFiltrosDisenadores>;

/**
 * DTO para la acción administrativa de validar (aprobar/rechazar) un diseñador.
 * `aprobar: true` valida el perfil; `aprobar: false` lo rechaza/desvalida.
 */
export const dtoValidarDisenador = z.object({
  aprobar: z.boolean(),
});
export type DatosValidarDisenador = z.infer<typeof dtoValidarDisenador>;
