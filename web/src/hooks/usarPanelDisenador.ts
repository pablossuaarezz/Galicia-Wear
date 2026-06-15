// Hooks del dashboard del diseñador: catálogo propio, detalle editable y perfil de marca.
//
// Estos hooks alimentan el panel privado del diseñador (rol DISENADOR): sus propias prendas
// publicadas, el detalle editable de una prenda concreta y el perfil de marca asociado a su
// cuenta. Todas las consultas se desactivan si el usuario no tiene el rol adecuado.
import { useQuery } from '@tanstack/react-query';
import { apiProductos } from '@/api/endpoints/productos';
import { apiDisenadores } from '@/api/endpoints/disenadores';
import { ErrorApi } from '@/api/clienteApi';
import { usarSesion } from '@/contexto/ContextoSesion';

/**
 * Obtiene el catálogo de prendas propias del diseñador autenticado.
 *
 * @returns El resultado de `useQuery` con la lista de prendas del diseñador. Solo se ejecuta
 *   si el usuario tiene el rol de diseñador (`esDisenador`).
 */
export function usarMisPrendas() {
  const { esDisenador } = usarSesion();
  return useQuery({
    queryKey: ['misPrendas'],
    queryFn: () => apiProductos.listarMios(),
    enabled: esDisenador,
  });
}

/**
 * Obtiene el detalle editable de una prenda propia del diseñador, identificada por su id.
 *
 * @param id Identificador de la prenda, o `undefined` si aún no está disponible (p. ej.
 *   parámetro de ruta pendiente).
 * @returns El resultado de `useQuery` con el detalle de la prenda. Solo se ejecuta cuando
 *   `id` tiene un valor.
 */
export function usarPrendaMia(id: string | undefined) {
  return useQuery({
    queryKey: ['prendaMia', id],
    queryFn: () => apiProductos.obtenerMio(id!),
    enabled: Boolean(id),
  });
}

/**
 * Obtiene el perfil de marca del diseñador autenticado (datos públicos de su marca/tienda).
 *
 * @returns El resultado de `useQuery` con el perfil de marca. Solo se ejecuta si el usuario
 *   tiene rol de diseñador. Si el backend responde 404 (el diseñador todavía no ha solicitado
 *   su perfil de marca), no se reintenta la petición, ya que sería inútil.
 */
export function usarPerfilMarca() {
  const { esDisenador } = usarSesion();
  return useQuery({
    queryKey: ['perfilMarca'],
    queryFn: () => apiDisenadores.yo(),
    enabled: esDisenador,
    // 404 = aún no ha solicitado su perfil de marca; no tiene sentido reintentar.
    retry: (intentos, error) => !(error instanceof ErrorApi && error.estado === 404) && intentos < 1,
  });
}
