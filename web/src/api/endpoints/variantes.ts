// Endpoints de variantes (anidados bajo un producto). Envueltos en { variantes } / { variante }.
import { solicitar } from '../clienteApi';
import type { EntradaVariante, Variante } from '../tipos';

export const apiVariantes = {
  async listar(productoId: string): Promise<Variante[]> {
    const { variantes } = await solicitar<{ variantes: Variante[] }>(
      `/productos/${productoId}/variantes`,
    );
    return variantes;
  },

  async crear(productoId: string, datos: EntradaVariante): Promise<Variante> {
    const { variante } = await solicitar<{ variante: Variante }>(
      `/productos/${productoId}/variantes`,
      { metodo: 'POST', cuerpo: datos },
    );
    return variante;
  },

  async actualizar(
    productoId: string,
    id: string,
    datos: Partial<EntradaVariante>,
  ): Promise<Variante> {
    const { variante } = await solicitar<{ variante: Variante }>(
      `/productos/${productoId}/variantes/${id}`,
      { metodo: 'PATCH', cuerpo: datos },
    );
    return variante;
  },

  eliminar(productoId: string, id: string): Promise<void> {
    return solicitar<void>(`/productos/${productoId}/variantes/${id}`, { metodo: 'DELETE' });
  },
};
