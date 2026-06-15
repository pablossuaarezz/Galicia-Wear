// Endpoints de pedidos y envíos. Respuestas envueltas: { pedidos } / { pedido } / { envio }.
import { solicitar } from '../clienteApi';
import type { EntradaActualizarEnvio, EntradaCrearPedido, Envio, Pedido } from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST de pedidos y de su envío asociado.
 * Cubre el ciclo de vida del pedido (creación, pago, aceptación por el diseñador,
 * cancelación) y la gestión del envío vinculado a cada pedido.
 */
export const apiPedidos = {
  /**
   * Lista los pedidos del usuario autenticado (como cliente). Llama a GET /pedidos.
   * @returns Array de pedidos (se desenvuelve la clave `pedidos`).
   */
  async listar(): Promise<Pedido[]> {
    const { pedidos } = await solicitar<{ pedidos: Pedido[] }>('/pedidos');
    return pedidos;
  },

  /**
   * Obtiene el detalle de un pedido concreto. Llama a GET /pedidos/:id.
   * @param id Identificador del pedido.
   * @returns El pedido completo con sus líneas.
   */
  async obtener(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}`);
    return pedido;
  },

  /**
   * Crea un nuevo pedido a partir del contenido del carrito y la dirección de envío.
   * Llama a POST /pedidos.
   * @param datos Datos del pedido (items, dirección, método de envío, etc.).
   * @returns El pedido recién creado, en estado pendiente de pago.
   */
  async crear(datos: EntradaCrearPedido): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>('/pedidos', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return pedido;
  },

  /**
   * Marca un pedido como pagado (simulación de pasarela). Llama a PATCH /pedidos/:id/pagar.
   * @param id Identificador del pedido a pagar.
   * @returns El pedido con su estado actualizado a pagado.
   */
  async pagar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/pagar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  /**
   * Acepta un pedido (acción del diseñador que confirma que lo va a preparar).
   * Llama a PATCH /pedidos/:id/aceptar.
   * @param id Identificador del pedido a aceptar.
   * @returns El pedido con su estado actualizado.
   */
  async aceptar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/aceptar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  /**
   * Cancela un pedido. Llama a PATCH /pedidos/:id/cancelar.
   * @param id Identificador del pedido a cancelar.
   * @returns El pedido con su estado actualizado a cancelado.
   */
  async cancelar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/cancelar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  // ---- Envío ----

  /**
   * Obtiene el envío asociado a un pedido. Llama a GET /pedidos/:pedidoId/envio.
   * @param pedidoId Identificador del pedido.
   * @returns El envío vinculado (estado, transportista, seguimiento, etc.).
   */
  async obtenerEnvio(pedidoId: string): Promise<Envio> {
    const { envio } = await solicitar<{ envio: Envio }>(`/pedidos/${pedidoId}/envio`);
    return envio;
  },

  /**
   * Actualiza los datos del envío de un pedido (acción del diseñador: estado,
   * número de seguimiento, etc.). Llama a PATCH /pedidos/:pedidoId/envio.
   * @param pedidoId Identificador del pedido.
   * @param datos Campos del envío a modificar.
   * @returns El envío ya actualizado.
   */
  async actualizarEnvio(pedidoId: string, datos: EntradaActualizarEnvio): Promise<Envio> {
    const { envio } = await solicitar<{ envio: Envio }>(`/pedidos/${pedidoId}/envio`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return envio;
  },
};
