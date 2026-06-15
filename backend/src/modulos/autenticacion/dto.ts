// JUSTIFICACIÓN: DTOs (Data Transfer Objects) con zod. Definen contrato HTTP de entrada,
// hacen validación + parseo y exportan los tipos TS para el resto del módulo.
// Cumple "API REST + validación" de la rúbrica DAM.
import { z } from 'zod';
import { Rol } from '@prisma/client';

/**
 * Esquema reutilizable para validar correos electrónicos: recorta espacios,
 * normaliza a minúsculas, valida formato de email y limita la longitud máxima
 * según el estándar (254 caracteres).
 */
const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Correo electrónico no válido')
  .max(254, 'Correo demasiado largo');

/**
 * Esquema reutilizable para validar contraseñas en el registro: exige una
 * longitud mínima/máxima y al menos una mayúscula, una minúscula y un número,
 * como medida básica de robustez de la contraseña.
 */
const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((valor) => /[A-Z]/.test(valor), 'Debe incluir al menos una letra mayúscula')
  .refine((valor) => /[a-z]/.test(valor), 'Debe incluir al menos una letra minúscula')
  .refine((valor) => /[0-9]/.test(valor), 'Debe incluir al menos un número');

// Trata ''/null como "ausente": el diseñador no envía nombre/apellidos y el
// cliente móvil serializa el cuerpo completo (Gson). Evita 400 espurios.
/**
 * Envuelve un esquema de string para que, además de ser opcional, los valores
 * `''` (cadena vacía) o `null` se traten como "campo ausente" (`undefined`)
 * antes de aplicar la validación. Esto evita errores 400 cuando un cliente
 * (p. ej. la app Android con Gson) serializa explícitamente campos vacíos.
 * @param esquema Esquema zod de tipo string a hacer opcional.
 * @returns Esquema que acepta el valor original, `undefined`, `''` o `null`.
 */
const opcionalVacio = (esquema: z.ZodString) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), esquema.optional());

/**
 * Esquema de validación para el registro de un nuevo usuario.
 * El rol solo puede ser CLIENTE o DISEÑADOR (el rol ADMIN se crea por seed,
 * nunca a través del registro público). Los campos nombre/apellidos son
 * opcionales a nivel de esquema, pero el servicio exige ambos si el rol es CLIENTE.
 */
export const dtoRegistro = z.object({
  correo: correoSchema,
  contrasena: contrasenaSchema,
  // El registro público sólo permite CLIENTE o DISEÑADOR. ADMIN se crea por seed.
  rol: z.enum([Rol.CLIENTE, Rol.DISENADOR]).default(Rol.CLIENTE),
  // Perfil mínimo del cliente, opcional en el alta (puede completarlo luego)
  nombre: opcionalVacio(z.string().trim().min(1, 'Nombre obligatorio').max(80)),
  apellidos: opcionalVacio(z.string().trim().min(1, 'Apellidos obligatorios').max(120)),
});
/** Tipo inferido de {@link dtoRegistro}, usado como entrada de `servicioAutenticacion.registrar`. */
export type DatosRegistro = z.infer<typeof dtoRegistro>;

/** Esquema de validación para el inicio de sesión (correo + contraseña). */
export const dtoLogin = z.object({
  correo: correoSchema,
  contrasena: z.string().min(1, 'Contraseña obligatoria'),
});
/** Tipo inferido de {@link dtoLogin}. */
export type DatosLogin = z.infer<typeof dtoLogin>;

/** Esquema de validación para la renovación de tokens (POST /auth/refresh). */
export const dtoRefresco = z.object({
  tokenRefresco: z.string().min(1, 'Token de refresco obligatorio'),
});
/** Tipo inferido de {@link dtoRefresco}. */
export type DatosRefresco = z.infer<typeof dtoRefresco>;

/** Esquema de validación para el cierre de sesión (POST /auth/logout). */
export const dtoCierreSesion = z.object({
  tokenRefresco: z.string().min(1, 'Token de refresco obligatorio'),
});
/** Tipo inferido de {@link dtoCierreSesion}. */
export type DatosCierreSesion = z.infer<typeof dtoCierreSesion>;

// Respuesta común de los endpoints que emiten tokens
/**
 * Forma de la respuesta devuelta por los endpoints que emiten o renuevan
 * tokens de sesión (registro, login y refresco).
 */
export interface RespuestaTokens {
  /** JWT de acceso, de corta duración, usado para autenticar las peticiones. */
  tokenAcceso: string;
  /** Token opaco de larga duración usado para obtener nuevos tokens de acceso. */
  tokenRefresco: string;
  expiraEn: string; // "15m"
  /** Datos mínimos del usuario autenticado, útiles para el cliente sin decodificar el JWT. */
  usuario: {
    id: string;
    correo: string;
    rol: Rol;
  };
}
