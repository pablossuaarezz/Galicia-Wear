// Hooks de pedidos (cliente y diseñador comparten endpoint: el backend filtra por rol).
import { useQuery } from '@tanstack/react-query';
import { apiPedidos } from '@/api/endpoints/pedidos';
import { usarSesion } from '@/contexto/ContextoSesion';

export function usarPedidos() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: () => apiPedidos.listar(),
    enabled: estaAutenticado,
  });
}

export function usarPedido(id: string | undefined) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => apiPedidos.obtener(id!),
    enabled: Boolean(id),
  });
}
