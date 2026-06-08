/* eslint-disable react-refresh/only-export-components */
// Carrito reactivo del cliente. Se apoya en React Query (clave ['carrito']) y aplica
// actualizaciones optimistas en cantidad/eliminación para que la UI responda al instante;
// si la API falla, se revierte y se avisa con un brindis. Solo se activa para CLIENTE.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCarrito } from '@/api/endpoints/carrito';
import { ErrorApi } from '@/api/clienteApi';
import type { Carrito, ItemCarrito } from '@/api/tipos';
import { aNumero } from '@/util/formatos';
import { COSTE_ENVIO, ENVIO_GRATUITO_DESDE } from '@/util/constantes';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarBrindis } from '@/componentes/ui/Brindis';

const CLAVE_CARRITO = ['carrito'] as const;

export interface ResumenCarrito {
  totalUnidades: number;
  subtotal: number;
  costeEnvio: number;
  total: number;
}

interface ValorCarrito {
  carrito: Carrito | undefined;
  items: ItemCarrito[];
  resumen: ResumenCarrito;
  estaVacio: boolean;
  cargando: boolean;
  ocupado: boolean;
  agregar: (varianteId: string, cantidad: number) => Promise<void>;
  establecerCantidad: (varianteId: string, cantidad: number) => Promise<void>;
  eliminar: (varianteId: string) => Promise<void>;
  vaciar: () => Promise<void>;
}

const ContextoCarrito = createContext<ValorCarrito | null>(null);

function precioLinea(item: ItemCarrito): number {
  return aNumero(item.variante.producto.precioBase) + aNumero(item.variante.ajustePrecio);
}

function calcularResumen(items: ItemCarrito[]): ResumenCarrito {
  const totalUnidades = items.reduce((suma, item) => suma + item.cantidad, 0);
  const subtotal = items.reduce((suma, item) => suma + precioLinea(item) * item.cantidad, 0);
  const costeEnvio = items.length === 0 || subtotal >= ENVIO_GRATUITO_DESDE ? 0 : COSTE_ENVIO;
  return { totalUnidades, subtotal, costeEnvio, total: subtotal + costeEnvio };
}

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const { estaAutenticado, rol } = usarSesion();
  const brindis = usarBrindis();
  const clienteConsultas = useQueryClient();
  const habilitado = estaAutenticado && rol === 'CLIENTE';

  const consulta = useQuery({
    queryKey: CLAVE_CARRITO,
    queryFn: () => apiCarrito.obtener(),
    enabled: habilitado,
  });

  // Cancela refetch en vuelo y guarda el carrito previo para poder revertir.
  async function instantaneaPrevia(): Promise<Carrito | undefined> {
    await clienteConsultas.cancelQueries({ queryKey: CLAVE_CARRITO });
    return clienteConsultas.getQueryData<Carrito>(CLAVE_CARRITO);
  }

  function revertir(previo: Carrito | undefined, error: unknown) {
    if (previo) clienteConsultas.setQueryData(CLAVE_CARRITO, previo);
    const mensaje = error instanceof ErrorApi ? error.message : 'No se pudo actualizar el carrito';
    brindis.error(mensaje);
  }

  const mutacionGuardar = useMutation({
    mutationFn: ({ varianteId, cantidad }: { varianteId: string; cantidad: number }) =>
      apiCarrito.agregarItem(varianteId, cantidad),
    onMutate: async ({ varianteId, cantidad }) => {
      const previo = await instantaneaPrevia();
      // Optimista solo si el ítem ya existe (cambio de cantidad); para uno nuevo esperamos
      // la respuesta del servidor, que trae la variante completa.
      if (previo?.items.some((i) => i.variante.id === varianteId)) {
        clienteConsultas.setQueryData<Carrito>(CLAVE_CARRITO, {
          ...previo,
          items: previo.items.map((i) =>
            i.variante.id === varianteId ? { ...i, cantidad } : i,
          ),
        });
      }
      return { previo };
    },
    onError: (error, _vars, contexto) => revertir(contexto?.previo, error),
    onSuccess: (carrito) => clienteConsultas.setQueryData(CLAVE_CARRITO, carrito),
  });

  const mutacionEliminar = useMutation({
    mutationFn: (varianteId: string) => apiCarrito.eliminarItem(varianteId),
    onMutate: async (varianteId) => {
      const previo = await instantaneaPrevia();
      if (previo) {
        clienteConsultas.setQueryData<Carrito>(CLAVE_CARRITO, {
          ...previo,
          items: previo.items.filter((i) => i.variante.id !== varianteId),
        });
      }
      return { previo };
    },
    onError: (error, _vars, contexto) => revertir(contexto?.previo, error),
    onSuccess: (carrito) => clienteConsultas.setQueryData(CLAVE_CARRITO, carrito),
  });

  const mutacionVaciar = useMutation({
    mutationFn: () => apiCarrito.vaciar(),
    onMutate: async () => {
      const previo = await instantaneaPrevia();
      if (previo) clienteConsultas.setQueryData<Carrito>(CLAVE_CARRITO, { ...previo, items: [] });
      return { previo };
    },
    onError: (error, _vars, contexto) => revertir(contexto?.previo, error),
    onSettled: () => clienteConsultas.invalidateQueries({ queryKey: CLAVE_CARRITO }),
  });

  const valor = useMemo<ValorCarrito>(() => {
    const items = consulta.data?.items ?? [];
    return {
      carrito: consulta.data,
      items,
      resumen: calcularResumen(items),
      estaVacio: items.length === 0,
      cargando: consulta.isLoading && habilitado,
      ocupado:
        mutacionGuardar.isPending || mutacionEliminar.isPending || mutacionVaciar.isPending,
      agregar: async (varianteId, cantidad) => {
        await mutacionGuardar.mutateAsync({ varianteId, cantidad });
      },
      establecerCantidad: async (varianteId, cantidad) => {
        await mutacionGuardar.mutateAsync({ varianteId, cantidad });
      },
      eliminar: async (varianteId) => {
        await mutacionEliminar.mutateAsync(varianteId);
      },
      vaciar: async () => {
        await mutacionVaciar.mutateAsync();
      },
    };
  }, [consulta.data, consulta.isLoading, habilitado, mutacionGuardar, mutacionEliminar, mutacionVaciar]);

  return <ContextoCarrito.Provider value={valor}>{children}</ContextoCarrito.Provider>;
}

export function usarCarrito(): ValorCarrito {
  const contexto = useContext(ContextoCarrito);
  if (!contexto) throw new Error('usarCarrito debe usarse dentro de <ProveedorCarrito>');
  return contexto;
}
