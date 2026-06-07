import { z } from 'zod';

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

const contrasenaSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Contraseña demasiado larga')
  .refine((v) => /[A-Z]/.test(v), 'Debe incluir al menos una mayúscula')
  .refine((v) => /[a-z]/.test(v), 'Debe incluir al menos una minúscula')
  .refine((v) => /[0-9]/.test(v), 'Debe incluir al menos un número');

export const dtoCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1, 'Contraseña actual obligatoria'),
  contrasenaNueva: contrasenaSchema,
});
export type DatosCambiarContrasena = z.infer<typeof dtoCambiarContrasena>;

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
