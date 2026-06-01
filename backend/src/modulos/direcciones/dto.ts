import { z } from 'zod';

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
export type DatosCrearDireccion = z.infer<typeof dtoCrearDireccion>;

export const dtoActualizarDireccion = dtoCrearDireccion.partial().strict();
export type DatosActualizarDireccion = z.infer<typeof dtoActualizarDireccion>;
