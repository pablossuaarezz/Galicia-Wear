import { z } from 'zod';
import { EstadoPedido, CiudadGallega, MaterialPrincipal } from '@prisma/client';

// Coerción de "true"/"false" (los query params siempre llegan como string)
const booleanoDesdeQuery = z
  .enum(['true', 'false'])
  .transform((valor) => valor === 'true');

const paginacion = {
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
};

// ---- Visor de logs de auditoría (Mongo) ----
export const dtoFiltrosLogs = z.object({
  ...paginacion,
  accion: z.string().trim().max(50).optional(),
  usuarioId: z.string().trim().max(64).optional(),
  recurso: z.string().trim().max(50).optional(),
});
export type FiltrosLogs = z.infer<typeof dtoFiltrosLogs>;

// ---- Listado global de pedidos ----
export const dtoFiltrosPedidosAdmin = z.object({
  ...paginacion,
  estado: z.nativeEnum(EstadoPedido).optional(),
});
export type FiltrosPedidosAdmin = z.infer<typeof dtoFiltrosPedidosAdmin>;

// ---- Listado de diseñadores (incluye pendientes de validación) ----
export const dtoFiltrosDisenadoresAdmin = z.object({
  ...paginacion,
  ciudad: z.nativeEnum(CiudadGallega).optional(),
  validado: booleanoDesdeQuery.optional(),
});
export type FiltrosDisenadoresAdmin = z.infer<typeof dtoFiltrosDisenadoresAdmin>;

// ---- Listado de productos (incluye inactivos/retirados) ----
export const dtoFiltrosProductosAdmin = z.object({
  ...paginacion,
  busqueda: z.string().trim().max(100).optional(),
  material: z.nativeEnum(MaterialPrincipal).optional(),
  activo: booleanoDesdeQuery.optional(),
});
export type FiltrosProductosAdmin = z.infer<typeof dtoFiltrosProductosAdmin>;

// La moderación de producto reutiliza el mismo contrato que la actualización del diseñador.
export { dtoActualizarProducto as dtoModerarProducto } from '../productos/dto';
