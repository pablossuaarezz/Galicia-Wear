// JUSTIFICACIÓN: DTOs (Data Transfer Objects) con zod. Definen contrato HTTP de entrada,
// hacen validación + parseo y exportan los tipos TS para el resto del módulo.
// Cumple "API REST + validación" de la rúbrica DAM.
import { z } from 'zod';
import { Rol } from '@prisma/client';

const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Correo electrónico no válido')
  .max(254, 'Correo demasiado largo');

const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine((valor) => /[A-Z]/.test(valor), 'Debe incluir al menos una letra mayúscula')
  .refine((valor) => /[a-z]/.test(valor), 'Debe incluir al menos una letra minúscula')
  .refine((valor) => /[0-9]/.test(valor), 'Debe incluir al menos un número');

export const dtoRegistro = z.object({
  correo: correoSchema,
  contrasena: contrasenaSchema,
  // El registro público sólo permite CLIENTE o DISEÑADOR. ADMIN se crea por seed.
  rol: z.enum([Rol.CLIENTE, Rol.DISENADOR]).default(Rol.CLIENTE),
  // Perfil mínimo del cliente, opcional en el alta (puede completarlo luego)
  nombre: z.string().trim().min(1, 'Nombre obligatorio').max(80).optional(),
  apellidos: z.string().trim().min(1, 'Apellidos obligatorios').max(120).optional(),
});
export type DatosRegistro = z.infer<typeof dtoRegistro>;

export const dtoLogin = z.object({
  correo: correoSchema,
  contrasena: z.string().min(1, 'Contraseña obligatoria'),
});
export type DatosLogin = z.infer<typeof dtoLogin>;

export const dtoRefresco = z.object({
  tokenRefresco: z.string().min(1, 'Token de refresco obligatorio'),
});
export type DatosRefresco = z.infer<typeof dtoRefresco>;

export const dtoCierreSesion = z.object({
  tokenRefresco: z.string().min(1, 'Token de refresco obligatorio'),
});
export type DatosCierreSesion = z.infer<typeof dtoCierreSesion>;

// Respuesta común de los endpoints que emiten tokens
export interface RespuestaTokens {
  tokenAcceso: string;
  tokenRefresco: string;
  expiraEn: string; // "15m"
  usuario: {
    id: string;
    correo: string;
    rol: Rol;
  };
}
