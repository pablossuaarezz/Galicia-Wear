/**
 * DTOs (Data Transfer Objects) del módulo Direcciones.
 *
 * Define los esquemas de validación con Zod para crear y actualizar direcciones
 * de envío, junto con los tipos TypeScript inferidos. El esquema de actualización
 * se deriva del de creación, haciendo todos los campos opcionales pero rechazando
 * cualquier campo adicional no reconocido.
 */
import { z } from 'zod';

/**
 * Esquema de validación para crear una nueva dirección de envío.
 * - `alias`: nombre corto identificativo (p. ej. "Casa", "Trabajo").
 * - `linea1`: dirección principal (calle, número, etc.), longitud mínima razonable.
 * - `linea2`: línea adicional opcional (piso, puerta, etc.).
 * - `ciudad`: nombre de la ciudad.
 * - `codigoPostal`: debe ser exactamente 5 dígitos numéricos (formato español).
 * - `provincia`: por defecto "A Coruña" (contexto del proyecto, moda gallega).
 * - `pais`: código ISO 3166-1 alpha-2 (2 letras), por defecto "ES".
 */
export const dtoCrearDireccion = z.object({
  alias: z.string().trim().min(1, 'Alias obligatorio').max(50),
  linea1: z.string().trim().min(5, 'Línea 1 demasiado corta').max(200),
  linea2: z.string().trim().max(200).optional(),
  ciudad: z.string().trim().min(2).max(100),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/, 'El código postal debe tener exactamente 5 dígitos'),
  provincia: z.string().trim().max(100).default('A Coruña'),
  pais: z.string().length(2, 'Código de país debe ser ISO 3166-1 alpha-2').default('ES'),
});
/** Tipo inferido a partir de `dtoCrearDireccion`. */
export type DatosCrearDireccion = z.infer<typeof dtoCrearDireccion>;

/**
 * Esquema de validación para actualizar parcialmente una dirección existente.
 * Se basa en `dtoCrearDireccion` pero con todos los campos opcionales (`.partial()`)
 * y rechaza cualquier propiedad no definida en el esquema original (`.strict()`),
 * evitando así actualizaciones accidentales con campos desconocidos.
 */
export const dtoActualizarDireccion = dtoCrearDireccion.partial().strict();
/** Tipo inferido a partir de `dtoActualizarDireccion`. */
export type DatosActualizarDireccion = z.infer<typeof dtoActualizarDireccion>;
