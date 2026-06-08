import { z } from 'zod';

// Paginación de la bandeja (mismos defaults/máximos que el resto de listados, p. ej. admin).
// Los query params llegan como string → z.coerce.number los normaliza.
export const dtoListarNotificaciones = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
export type FiltrosNotificaciones = z.infer<typeof dtoListarNotificaciones>;
