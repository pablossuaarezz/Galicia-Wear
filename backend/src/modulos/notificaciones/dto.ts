// DTOs (Data Transfer Objects) de validación de entrada para el módulo de notificaciones,
// definidos con Zod. Se aplican sobre los query params de las rutas REST antes de
// pasarlos al servicio.
import { z } from 'zod';

/**
 * Esquema de validación para los parámetros de consulta de `GET /notificaciones`.
 * Paginación de la bandeja (mismos defaults/máximos que el resto de listados, p. ej. admin).
 * Los query params llegan como string → z.coerce.number los normaliza a número.
 * - `pagina`: número de página solicitado (mínimo 1, por defecto 1).
 * - `limite`: tamaño de página (entre 1 y 100, por defecto 20).
 */
export const dtoListarNotificaciones = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

/** Tipo inferido a partir de {@link dtoListarNotificaciones}, usado como filtros tipados en el servicio. */
export type FiltrosNotificaciones = z.infer<typeof dtoListarNotificaciones>;
