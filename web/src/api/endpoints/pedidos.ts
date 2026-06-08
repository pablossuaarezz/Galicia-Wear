// Endpoints de pedidos y envíos. Respuestas envueltas: { pedidos } / { pedido } / { envio }.
import { solicitar } from '../clienteApi';
import type { EntradaActualizarEnvio, EntradaCrearPedido, Envio, Pedido } from '../tipos';

export const apiPedidos = {
  async listar(): Promise<Pedido[]> {
    const { pedidos } = await solicitar<{ pedidos: Pedido[] }>('/pedidos');
    return pedidos;
  },

  async obtener(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}`);
    return pedido;
  },

  async crear(datos: EntradaCrearPedido): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>('/pedidos', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return pedido;
  },

  async pagar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/pagar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  async aceptar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/aceptar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  async cancelar(id: string): Promise<Pedido> {
    const { pedido } = await solicitar<{ pedido: Pedido }>(`/pedidos/${id}/cancelar`, {
      metodo: 'PATCH',
    });
    return pedido;
  },

  // ---- Envío ----

  async obtenerEnvio(pedidoId: string): Promise<Envio> {
    const { envio } = await solicitar<{ envio: Envio }>(`/pedidos/${pedidoId}/envio`);
    return envio;
  },

  async actualizarEnvio(pedidoId: string, datos: EntradaActualizarEnvio): Promise<Envio> {
    const { envio } = await solicitar<{ envio: Envio }>(`/pedidos/${pedidoId}/envio`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return envio;
  },
};
