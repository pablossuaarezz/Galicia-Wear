import { Rol, EstadoPedido } from '@prisma/client';
import {
  ErrorAccesoDenegado,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { repositorioCarrito } from '../carrito/repositorio';
import { repositorioDirecciones } from '../direcciones/repositorio';
import { servicioNotificaciones } from '../notificaciones/servicio';
import type { TipoNotificacion } from '../mongo/esquemas/notificacionLog';
import { repositorioPedidos, type PedidoDetalle } from './repositorio';
import type { DatosCrearPedido } from './dto';

const ENVIO_GRATUITO_DESDE = 50; // €
const COSTE_ENVIO_DEFECTO = 4.9;

// Diseñadores únicos con líneas en el pedido.
function disenadoresDe(pedido: PedidoDetalle): string[] {
  return [...new Set(pedido.lineas.map((l) => l.disenadorId))];
}

// Dispara una notificación de pedido sin bloquear el flujo: `crear` ya degrada con
// elegancia (loguea y sigue) si Mongo o el socket fallan, así que aquí basta fire-and-forget.
function notificarPedido(
  destinatarioId: string,
  tipo: TipoNotificacion,
  titulo: string,
  cuerpo: string,
  pedidoId: string,
): void {
  void servicioNotificaciones.crear({ destinatarioId, tipo, titulo, cuerpo, datos: { pedidoId } });
}

export const servicioPedidos = {
  async checkout(clienteId: string, datos: DatosCrearPedido): Promise<PedidoDetalle> {
    // 1. Obtener carrito
    const carrito = await repositorioCarrito.buscarDeCliente(clienteId);
    if (!carrito || carrito.items.length === 0) {
      throw new ErrorReglaDeNegocio('El carrito está vacío');
    }

    // 2. Validar dirección de envío
    const direccion = await repositorioDirecciones.buscarPorId(datos.direccionEnvioId);
    if (!direccion || direccion.usuarioId !== clienteId) {
      throw new ErrorNoEncontrado('Dirección de envío');
    }

    // 3. Validar disponibilidad (pre-check antes de la transacción)
    for (const item of carrito.items) {
      if (!item.variante.producto.activo) {
        throw new ErrorReglaDeNegocio(
          `El producto "${item.variante.producto.nombre}" ya no está disponible`,
        );
      }
      if (item.variante.stock < item.cantidad) {
        throw new ErrorReglaDeNegocio(
          `Stock insuficiente para ${item.variante.sku} ` +
          `(disponible: ${item.variante.stock}, solicitado: ${item.cantidad})`,
        );
      }
    }

    // 4. Calcular totales
    let subtotal = 0;
    for (const item of carrito.items) {
      const precioUnitario =
        Number(item.variante.producto.precioBase) + Number(item.variante.ajustePrecio);
      subtotal += precioUnitario * item.cantidad;
    }
    const costeEnvio = subtotal >= ENVIO_GRATUITO_DESDE ? 0 : COSTE_ENVIO_DEFECTO;
    const total = subtotal + costeEnvio;

    // 5. Crear pedido (transacción ACID en el repositorio)
    const pedido = await repositorioPedidos.crearDesdeCarrito({
      carrito,
      clienteId,
      subtotal,
      costeEnvio,
      total,
      direccionEnvioId: datos.direccionEnvioId,
      metodoPago: datos.metodoPago,
      notas: datos.notas,
    });

    // 6. Avisar a cada diseñador con líneas en el pedido (no bloqueante).
    for (const disenadorId of disenadoresDe(pedido)) {
      notificarPedido(
        disenadorId,
        'PEDIDO_CREADO',
        'Nuevo pedido',
        `Has recibido el pedido ${pedido.numeroPedido}`,
        pedido.id,
      );
    }
    return pedido;
  },

  async listar(usuarioId: string, rol: Rol): Promise<PedidoDetalle[]> {
    if (rol === Rol.CLIENTE) return repositorioPedidos.listarDeCliente(usuarioId);
    if (rol === Rol.DISENADOR) return repositorioPedidos.listarDeDisenador(usuarioId);
    throw new ErrorAccesoDenegado('Solo clientes y diseñadores pueden listar pedidos');
  },

  async obtenerDetalle(id: string, usuarioId: string, rol: Rol): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(id);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    const esCliente = rol === Rol.CLIENTE && pedido.clienteId === usuarioId;
    const esDisenador =
      rol === Rol.DISENADOR && pedido.lineas.some((l) => l.disenadorId === usuarioId);
    const esAdmin = rol === Rol.ADMIN;

    if (!esCliente && !esDisenador && !esAdmin) {
      throw new ErrorAccesoDenegado('No tienes acceso a este pedido');
    }
    return pedido;
  },

  // Stub: aprueba el pago sin pasarela real
  async pagar(id: string, clienteId: string): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(id);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');
    if (pedido.clienteId !== clienteId) throw new ErrorAccesoDenegado('No es tu pedido');
    if (pedido.estado !== EstadoPedido.PENDIENTE_PAGO) {
      throw new ErrorReglaDeNegocio(`El pedido no está en estado PENDIENTE_PAGO (actual: ${pedido.estado})`);
    }
    const pagado = await repositorioPedidos.marcarComoPagado(id);
    for (const disenadorId of disenadoresDe(pagado)) {
      notificarPedido(
        disenadorId,
        'PEDIDO_PAGADO',
        'Pedido pagado',
        `El pedido ${pagado.numeroPedido} ha sido pagado, ya puedes aceptarlo`,
        pagado.id,
      );
    }
    return pagado;
  },

  async aceptar(pedidoId: string, disenadorId: string): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(pedidoId);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');
    if (pedido.estado !== EstadoPedido.PAGADO) {
      throw new ErrorReglaDeNegocio(`Solo se pueden aceptar pedidos en estado PAGADO (actual: ${pedido.estado})`);
    }
    const tieneLineas = pedido.lineas.some((l) => l.disenadorId === disenadorId);
    if (!tieneLineas) {
      throw new ErrorAccesoDenegado('No tienes líneas en este pedido');
    }
    const aceptado = await repositorioPedidos.aceptarLineas(pedidoId, disenadorId);
    notificarPedido(
      aceptado.clienteId,
      'PEDIDO_ACEPTADO',
      'Pedido aceptado',
      `Tu pedido ${aceptado.numeroPedido} ha sido aceptado y se está preparando`,
      aceptado.id,
    );
    return aceptado;
  },

  async cancelar(id: string, usuarioId: string, rol: Rol): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(id);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    const esCliente = rol === Rol.CLIENTE && pedido.clienteId === usuarioId;
    if (!esCliente && rol !== Rol.ADMIN) {
      throw new ErrorAccesoDenegado('Solo el cliente o un admin pueden cancelar el pedido');
    }

    const estadosCancelables: EstadoPedido[] = [EstadoPedido.PENDIENTE_PAGO, EstadoPedido.PAGADO];
    if (!estadosCancelables.includes(pedido.estado)) {
      throw new ErrorReglaDeNegocio(
        `No se puede cancelar un pedido en estado ${pedido.estado}`,
      );
    }
    const cancelado = await repositorioPedidos.cancelar(id);
    // Si lo cancela el cliente, la contraparte son los diseñadores del pedido.
    for (const disenadorId of disenadoresDe(cancelado)) {
      notificarPedido(
        disenadorId,
        'PEDIDO_CANCELADO',
        'Pedido cancelado',
        `El pedido ${cancelado.numeroPedido} ha sido cancelado`,
        cancelado.id,
      );
    }
    return cancelado;
  },
};
