// Cliente de React Query compartido. Defaults pensados para un storefront:
// datos frescos durante 30 s, 1 reintento (salvo errores 4xx, que no se reintentan), y sin
// refetch agresivo al enfocar la ventana para no parpadear durante la defensa.
import { QueryClient } from '@tanstack/react-query';
import { ErrorApi } from './clienteApi';

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
