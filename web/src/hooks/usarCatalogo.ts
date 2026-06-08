// Hooks de lectura del catálogo público (productos, detalle, certificados, diseñadores).
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiProductos } from '@/api/endpoints/productos';
import { apiCertificados } from '@/api/endpoints/catalogoApoyo';
import { apiDisenadores } from '@/api/endpoints/disenadores';
import type { CiudadGallega, FiltrosCatalogo } from '@/api/tipos';

export function usarCatalogo(filtros: FiltrosCatalogo) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: ({ signal }) => apiProductos.listar(filtros, signal),
    // Mantiene la página anterior visible mientras carga la nueva (sin parpadeo al paginar).
    placeholderData: keepPreviousData,
  });
}

export function usarProducto(slug: string | undefined) {
  return useQuery({
    queryKey: ['producto', slug],
    queryFn: () => apiProductos.obtener(slug!),
    enabled: Boolean(slug),
  });
}

export function usarCertificados() {
  return useQuery({
    queryKey: ['certificados'],
    queryFn: () => apiCertificados.listar(),
    staleTime: 10 * 60_000, // el catálogo de certificados casi no cambia
  });
}

export function usarDisenadores(filtros: { ciudad?: CiudadGallega; pagina?: number; limite?: number } = {}) {
  return useQuery({
    queryKey: ['disenadores', filtros],
    queryFn: () => apiDisenadores.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function usarDisenador(id: string | undefined) {
  return useQuery({
    queryKey: ['disenador', id],
    queryFn: () => apiDisenadores.obtener(id!),
    enabled: Boolean(id),
  });
}
