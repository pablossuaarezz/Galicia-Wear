// Endpoints del carrito (solo clientes). Respuestas envueltas en { carrito }.
// Conjunto de operaciones sobre el carrito del cliente autenticado: consultar el contenido,
// añadir o quitar líneas y vaciarlo por completo. El backend devuelve el carrito completo y
// recalculado tras cada mutación, por lo que estos métodos desenvuelven { carrito } y lo
// retornan ya listo para refrescar la caché de React Query sin peticiones adicionales.
import { solicitar } from '../clienteApi';
import type { Carrito } from '../tipos';

/**
 * Cliente de los endpoints del carrito de la compra (recurso privado del cliente).
 */
export const apiCarrito = {
  /**
   * Obtiene el carrito actual del cliente autenticado con todas sus líneas.
   * Endpoint: GET /carrito.
   * @returns Promesa con el carrito (se desenvuelve la clave { carrito }).
   */
  async obtener(): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>('/carrito');
    return carrito;
  },

  /**
   * Añade una variante de producto al carrito (o incrementa su cantidad si ya existe).
   * Endpoint: POST /carrito/items.
   * @param varianteId Identificador de la variante (talla/color) a añadir.
   * @param cantidad Número de unidades a añadir.
   * @returns Promesa con el carrito recalculado tras la operación.
   */
  async agregarItem(varianteId: string, cantidad: number): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>('/carrito/items', {
      metodo: 'POST',
      cuerpo: { varianteId, cantidad },
    });
    return carrito;
  },

  /**
   * Elimina del carrito la línea correspondiente a una variante concreta.
   * Endpoint: DELETE /carrito/items/{varianteId}.
   * @param varianteId Identificador de la variante cuya línea se elimina.
   * @returns Promesa con el carrito recalculado tras la eliminación.
   */
  async eliminarItem(varianteId: string): Promise<Carrito> {
    const { carrito } = await solicitar<{ carrito: Carrito }>(`/carrito/items/${varianteId}`, {
      metodo: 'DELETE',
    });
    return carrito;
  },

  /**
   * Vacía el carrito por completo (elimina todas sus líneas).
   * Endpoint: DELETE /carrito.
   * @returns Promesa que se resuelve al completarse (respuesta 204 sin cuerpo).
   */
  vaciar(): Promise<void> {
    return solicitar<void>('/carrito', { metodo: 'DELETE' });
  },
};
