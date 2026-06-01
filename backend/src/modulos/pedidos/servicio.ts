import { Rol, EstadoPedido } from '@prisma/client';
import {
  ErrorAccesoDenegado,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { repositorioCarrito } from '../carrito/repositorio';
import { repositorioDirecciones } from '../direcciones/repositorio';
import { repositorioPedidos, type PedidoDetalle } from './repositorio';
import type { DatosCrearPedido } from './dto';

const ENVIO_GRATUITO_DESDE = 50; // €
const COSTE_ENVIO_DEFECTO = 4.9;

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
    return repositorioPedidos.crearDesdeCarrito({
      carrito,
      clienteId,
      subtotal,
      costeEnvio,
      total,
      direccionEnvioId: datos.direccionEnvioId,
      metodoPago: datos.metodoPago,
      notas: datos.notas,
    });
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
    return repositorioPedidos.marcarComoPagado(id);
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
    return repositorioPedidos.aceptarLineas(pedidoId, disenadorId);
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
    return repositorioPedidos.cancelar(id);
  },
};
