// Endpoints del carrito (solo clientes). Respuestas envueltas en { carrito }.
import { solicitar } from '../clienteApi';
import type { Carrito } from '../tipos';

export const apiCarrito = {
  async obtener(): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>('/carrito');
    return carrito;
  },

  async agregarItem(varianteId: string, cantidad: number): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>('/carrito/items', {
      metodo: 'POST',
      cuerpo: { varianteId, cantidad },
    });
    return carrito;
  },

  async eliminarItem(varianteId: string): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>(`/carrito/items/${varianteId}`, {
      metodo: 'DELETE',
    });
    return carrito;
  },

  vaciar(): Promise<void> {
    return solicitar<void>('/carrito', { metodo: 'DELETE' });
  },
};
