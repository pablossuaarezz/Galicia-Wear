// DTOs (Data Transfer Objects) del módulo de administración, definidos con zod.
// Validan y parsean los query params de los listados administrativos (paginación,
// filtros) y los tipos TypeScript inferidos se reutilizan en repositorio.ts y
// controlador.ts para tipar de extremo a extremo las peticiones.
import { z } from 'zod';
import { EstadoPedido, CiudadGallega, MaterialPrincipal } from '@prisma/client';

// Coerción de "true"/"false" (los query params siempre llegan como string)
// Los query strings de Express siempre llegan como texto, por lo que un booleano
// real ("true"/"false") debe transformarse explícitamente a `boolean` de JS.
const booleanoDesdeQuery = z
  .enum(['true', 'false'])
  .transform((valor) => valor === 'true');

// Fragmento de esquema reutilizable para la paginación común a todos los listados:
// `pagina` (1-indexada, mínimo 1) y `limite` (entre 1 y 100, por defecto 50).
// `z.coerce.number()` convierte el string del query param a número antes de validar.
const paginacion = {
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
};

// ---- Visor de logs de auditoría (Mongo) ----
/**
 * Esquema de validación para los filtros del visor de logs de auditoría (MongoDB).
 * Todos los filtros son opcionales; se combina con la paginación común.
 */
export const dtoFiltrosLogs = z.object({
  ...paginacion,
  accion: z.string().trim().max(50).optional(),
  usuarioId: z.string().trim().max(64).optional(),
  recurso: z.string().trim().max(50).optional(),
});
/** Tipo inferido de {@link dtoFiltrosLogs}, usado para tipar `listarLogs`. */
export type FiltrosLogs = z.infer<typeof dtoFiltrosLogs>;

// ---- Listado global de pedidos ----
/**
 * Esquema de validación para el listado global de pedidos del administrador.
 * Permite filtrar opcionalmente por estado del pedido (enum de Prisma).
 */
export const dtoFiltrosPedidosAdmin = z.object({
  ...paginacion,
  estado: z.nativeEnum(EstadoPedido).optional(),
});
/** Tipo inferido de {@link dtoFiltrosPedidosAdmin}. */
export type FiltrosPedidosAdmin = z.infer<typeof dtoFiltrosPedidosAdmin>;

// ---- Listado de diseñadores (incluye pendientes de validación) ----
/**
 * Esquema de validación para el listado de diseñadores del administrador.
 * Permite filtrar por ciudad gallega y por estado de validación (pendiente/validado).
 */
export const dtoFiltrosDisenadoresAdmin = z.object({
  ...paginacion,
  ciudad: z.nativeEnum(CiudadGallega).optional(),
  validado: booleanoDesdeQuery.optional(),
});
/** Tipo inferido de {@link dtoFiltrosDisenadoresAdmin}. */
export type FiltrosDisenadoresAdmin = z.infer<typeof dtoFiltrosDisenadoresAdmin>;

// ---- Listado de productos (incluye inactivos/retirados) ----
/**
 * Esquema de validación para el listado completo de productos del administrador
 * (incluye productos inactivos/retirados, no visibles públicamente).
 * Permite búsqueda por texto, filtro por material principal y por estado activo.
 */
export const dtoFiltrosProductosAdmin = z.object({
  ...paginacion,
  busqueda: z.string().trim().max(100).optional(),
  material: z.nativeEnum(MaterialPrincipal).optional(),
  activo: booleanoDesdeQuery.optional(),
});
/** Tipo inferido de {@link dtoFiltrosProductosAdmin}. */
export type FiltrosProductosAdmin = z.infer<typeof dtoFiltrosProductosAdmin>;

// La moderación de producto reutiliza el mismo contrato que la actualización del diseñador.
// Se re-exporta con un alias semántico (`dtoModerarProducto`) para que el controlador de
// admin no dependa directamente del módulo de productos, evitando duplicar el esquema.
export { dtoActualizarProducto as dtoModerarProducto } from '../productos/dto';
