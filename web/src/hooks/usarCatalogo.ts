// Hooks de lectura del catálogo público (productos, detalle, certificados, diseñadores).
//
// Todos los hooks de este módulo son de SOLO LECTURA y se apoyan en React Query para el
// cacheo, la revalidación y los estados de carga/error. Se usan principalmente en las páginas
// públicas del catálogo (listado, detalle de producto, listado de diseñadores, detalle de
// diseñador) y no requieren autenticación.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiProductos } from '@/api/endpoints/productos';
import { apiCertificados } from '@/api/endpoints/catalogoApoyo';
import { apiDisenadores } from '@/api/endpoints/disenadores';
import type { CiudadGallega, FiltrosCatalogo } from '@/api/tipos';

/**
 * Obtiene el listado paginado/filtrado de productos del catálogo.
 *
 * @param filtros Objeto con los filtros activos (búsqueda, categoría, ciudad, página, etc.).
 *   Forma parte de la `queryKey`, de modo que cualquier cambio en los filtros provoca
 *   automáticamente una nueva petición y se cachea por combinación de filtros.
 * @returns El resultado de `useQuery` (datos, estado de carga, error, etc.) con la lista de
 *   productos para esos filtros.
 */
export function usarCatalogo(filtros: FiltrosCatalogo) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: ({ signal }) => apiProductos.listar(filtros, signal),
    // Mantiene la página anterior visible mientras carga la nueva (sin parpadeo al paginar).
    placeholderData: keepPreviousData,
  });
}

/**
 * Obtiene el detalle de un producto a partir de su slug (identificador legible en la URL).
 *
 * @param slug Slug del producto, o `undefined` si todavía no se conoce (p. ej. mientras el
 *   parámetro de ruta no está disponible).
 * @returns El resultado de `useQuery` con el detalle del producto. La consulta solo se
 *   ejecuta cuando `slug` tiene un valor (ver `enabled`).
 */
export function usarProducto(slug: string | undefined) {
  return useQuery({
    queryKey: ['producto', slug],
    queryFn: () => apiProductos.obtener(slug!),
    // Evita lanzar la petición con un slug vacío/indefinido (p. ej. durante el primer render).
    enabled: Boolean(slug),
  });
}

/**
 * Obtiene el catálogo de certificados/sellos de sostenibilidad usados por los productos
 * (p. ej. certificaciones textiles, de origen, etc.).
 *
 * @returns El resultado de `useQuery` con la lista de certificados. Se marca con un
 *   `staleTime` largo porque este catálogo apenas cambia.
 */
export function usarCertificados() {
  return useQuery({
    queryKey: ['certificados'],
    queryFn: () => apiCertificados.listar(),
    staleTime: 10 * 60_000, // el catálogo de certificados casi no cambia
  });
}

/**
 * Obtiene el listado de diseñadores/marcas, opcionalmente filtrado por ciudad y paginado.
 *
 * @param filtros Filtros opcionales: ciudad gallega, número de página y límite de resultados
 *   por página. Por defecto, objeto vacío (sin filtrar).
 * @returns El resultado de `useQuery` con la lista de diseñadores para esos filtros.
 */
export function usarDisenadores(filtros: { ciudad?: CiudadGallega; pagina?: number; limite?: number } = {}) {
  return useQuery({
    queryKey: ['disenadores', filtros],
    queryFn: () => apiDisenadores.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

/**
 * Obtiene el detalle de un diseñador/marca a partir de su identificador.
 *
 * @param id Identificador del diseñador, o `undefined` si aún no está disponible.
 * @returns El resultado de `useQuery` con el detalle del diseñador. La consulta solo se
 *   ejecuta cuando `id` tiene un valor.
 */
export function usarDisenador(id: string | undefined) {
  return useQuery({
    queryKey: ['disenador', id],
    queryFn: () => apiDisenadores.obtener(id!),
    enabled: Boolean(id),
  });
}
