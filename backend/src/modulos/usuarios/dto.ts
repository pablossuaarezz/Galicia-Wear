// DTOs (Data Transfer Objects) de validación para el módulo de usuarios.
// Definen, mediante esquemas Zod, la forma y restricciones de los datos
// que llegan en las peticiones de gestión del perfil propio: edición de
// datos de cliente, cambio de contraseña, preferencias de sostenibilidad
// y registro del token de notificaciones push.

import { z } from 'zod';

/**
 * Esquema de validación para actualizar el perfil de un cliente.
 * Todos los campos son opcionales (PATCH parcial) y se aplica `.strict()`
 * para rechazar cualquier campo no reconocido.
 * - `telefono`: admite prefijo internacional opcional (+) y entre 9 y 15 dígitos.
 * - `fechaNacimiento`: se valida que no sea una fecha futura.
 * - `avatarUrl`: admite tanto una URL como una imagen en base64 (data URI);
 *   se limita el tamaño a 8MB ya que la app reduce la imagen antes de enviarla,
 *   pero conviene mantener un límite de seguridad en el backend.
 */
export const dtoActualizarPerfilCliente = z
  .object({
    nombre: z.string().trim().min(1, 'Nombre obligatorio').max(80).optional(),
    apellidos: z.string().trim().min(1, 'Apellidos obligatorios').max(120).optional(),
    telefono: z
      .string()
      .regex(/^\+?[0-9]{9,15}$/, 'Teléfono no válido')
      .optional()
      .nullable(),
    fechaNacimiento: z.coerce
      .date()
      .max(new Date(), 'La fecha de nacimiento no puede ser futura')
      .optional()
      .nullable(),
    // Foto de perfil como data URI base64 (data:image/...;base64,XXXX) o URL.
    // La app reduce la imagen antes de enviarla; aun así limitamos el tamaño.
    avatarUrl: z
      .string()
      .max(8_000_000, 'La imagen es demasiado grande')
      .optional()
      .nullable(),
  })
  .strict();
export type DatosActualizarPerfilCliente = z.infer<typeof dtoActualizarPerfilCliente>;

/**
 * Esquema reutilizable para validar la robustez de una contraseña nueva:
 * longitud entre 8 y 128 caracteres, y debe contener al menos una mayúscula,
 * una minúscula y un número.
 */
const contrasenaSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Contraseña demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'Debe incluir al menos una mayúscula')
  .refine((v) => /[a-z]/.test(v), 'Debe incluir al menos una minúscula')
  .refine((v) => /[0-9]/.test(v), 'Debe incluir al menos un número');

/**
 * Esquema de validación para el cambio de contraseña: requiere la
 * contraseña actual (para verificarla en el servicio) y la contraseña
 * nueva, que debe cumplir `contrasenaSchema`.
 */
export const dtoCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1, 'Contraseña actual obligatoria'),
  contrasenaNueva: contrasenaSchema,
});
export type DatosCambiarContrasena = z.infer<typeof dtoCambiarContrasena>;

/**
 * Esquema de validación para las preferencias de sostenibilidad del cliente:
 * lista de certificados preferidos, distancia máxima de origen (km) y
 * ciudad gallega de interés. Todos los campos son opcionales y se aplica
 * `.strict()` para no admitir campos adicionales.
 */
export const dtoActualizarPreferencias = z
  .object({
    certificados: z
      .array(z.enum(['GOTS', 'OEKO_TEX', 'FAIRTRADE', 'GRS', 'BLUESIGN', 'ECOCERT']))
      .optional(),
    maxKm: z.number().int().min(0).max(2000).optional(),
    ciudad: z
      .enum(['CORUNA', 'LUGO', 'SANTIAGO', 'VIGO', 'PONTEVEDRA', 'OURENSE'])
      .optional(),
  })
  .strict();
export type DatosActualizarPreferencias = z.infer<typeof dtoActualizarPreferencias>;

// Token de dispositivo para push FCM (best-effort). La plataforma es opcional (por defecto
// android). Se guarda en Mongo (colección device_tokens), sin migración Prisma.
/**
 * Esquema de validación para el registro del token de notificaciones push (FCM).
 * - `token`: identificador del dispositivo proporcionado por Firebase Cloud Messaging.
 * - `plataforma`: opcional, p. ej. "android" o "ios"; si no se indica, se asume Android.
 */
export const dtoTokenFcm = z
  .object({
    token: z.string().trim().min(1, 'Token obligatorio').max(4096),
    plataforma: z.string().trim().max(20).optional(),
  })
  .strict();
export type DatosTokenFcm = z.infer<typeof dtoTokenFcm>;
