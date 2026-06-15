// Hooks de pedidos (cliente y diseñador comparten endpoint: el backend filtra por rol).
//
// Estos hooks consultan los pedidos del usuario autenticado. El mismo endpoint REST sirve
// tanto para clientes (sus propios pedidos de compra) como para diseñadores (pedidos
// recibidos de sus prendas), siendo el backend el que aplica el filtrado según el rol del
// usuario autenticado.
import { useQuery } from '@tanstack/react-query';
import { apiPedidos } from '@/api/endpoints/pedidos';
import { usarSesion } from '@/contexto/ContextoSesion';

/**
 * Obtiene el listado de pedidos del usuario autenticado (compras si es cliente, pedidos
 * recibidos si es diseñador, según determine el backend).
 *
 * @returns El resultado de `useQuery` con la lista de pedidos. Solo se ejecuta si hay sesión
 *   iniciada.
 */
export function usarPedidos() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: () => apiPedidos.listar(),
    enabled: estaAutenticado,
  });
}

/**
 * Obtiene el detalle de un pedido concreto a partir de su identificador.
 *
 * @param id Identificador del pedido, o `undefined` si aún no está disponible.
 * @returns El resultado de `useQuery` con el detalle del pedido. Solo se ejecuta cuando `id`
 *   tiene un valor.
 */
export function usarPedido(id: string | undefined) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => apiPedidos.obtener(id!),
    enabled: Boolean(id),
  });
}
