// Hooks del dashboard del diseñador: catálogo propio, detalle editable y perfil de marca.
import { useQuery } from '@tanstack/react-query';
import { apiProductos } from '@/api/endpoints/productos';
import { apiDisenadores } from '@/api/endpoints/disenadores';
import { ErrorApi } from '@/api/clienteApi';
import { usarSesion } from '@/contexto/ContextoSesion';

export function usarMisPrendas() {
  const { esDisenador } = usarSesion();
  return useQuery({
    queryKey: ['misPrendas'],
    queryFn: () => apiProductos.listarMios(),
    enabled: esDisenador,
  });
}

export function usarPrendaMia(id: string | undefined) {
  return useQuery({
    queryKey: ['prendaMia', id],
    queryFn: () => apiProductos.obtenerMio(id!),
    enabled: Boolean(id),
  });
}

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
