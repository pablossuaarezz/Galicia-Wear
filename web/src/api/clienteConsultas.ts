// Cliente de React Query compartido. Defaults pensados para un storefront:
// datos frescos durante 30 s, 1 reintento (salvo errores 4xx, que no se reintentan), y sin
// refetch agresivo al enfocar la ventana para no parpadear durante la defensa.
import { QueryClient } from '@tanstack/react-query';
import { ErrorApi } from './clienteApi';

/**
 * Instancia única de QueryClient de React Query, compartida por toda la aplicación
 * (se inyecta mediante `QueryClientProvider` en el árbol de componentes).
 *
 * Configuración por defecto:
 * - `staleTime`: los datos se consideran "frescos" durante 30 segundos, por lo que
 *   no se vuelven a pedir al backend si se reutiliza la misma query key en ese tiempo.
 * - `gcTime`: las queries inactivas permanecen en caché 5 minutos antes de eliminarse.
 * - `refetchOnWindowFocus`: desactivado para evitar refetchs y parpadeos al cambiar
 *   de pestaña (especialmente molesto durante la defensa del TFG).
 * - `retry` (queries): no reintenta errores 4xx (validación, no encontrado, permisos…),
 *   ya que repetir la petición no cambiará el resultado; para el resto de errores
 *   permite un único reintento.
 * - `retry` (mutations): sin reintentos automáticos, para no duplicar operaciones
 *   con efectos secundarios (crear pedido, pagar, etc.).
 */
export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) => {
        // No reintentar errores de cliente (validación, no encontrado, permisos…).
        if (error instanceof ErrorApi && error.estado >= 400 && error.estado < 500) return false;
        return intentos < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
