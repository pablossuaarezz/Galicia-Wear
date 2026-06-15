// Servicio (capa de lógica de negocio) del módulo de pedidos.
// Orquesta el flujo de checkout, consulta de pedidos, pago, aceptación por
// parte de los diseñadores y cancelación, aplicando las reglas de negocio
// (validaciones de stock, autorización por rol, transiciones de estado
// permitidas) y delegando el acceso a datos en `repositorioPedidos`.
// También dispara las notificaciones correspondientes a cada cambio de estado.

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

// Importe mínimo (en euros) a partir del cual el envío es gratuito.
const ENVIO_GRATUITO_DESDE = 50; // €
// Coste de envío estándar aplicado cuando el subtotal no alcanza el umbral anterior.
const COSTE_ENVIO_DEFECTO = 4.9;

/**
 * Obtiene la lista de identificadores de diseñadores que tienen al menos una
 * línea en el pedido, sin duplicados. Se usa para saber a quién hay que
 * notificar tras cada cambio de estado del pedido.
 * @param pedido Pedido del que se extraen los diseñadores.
 * @returns Array de ids de diseñador únicos.
 */
function disenadoresDe(pedido: PedidoDetalle): string[] {
  return [...new Set(pedido.lineas.map((l) => l.disenadorId))];
}

/**
 * Dispara una notificación de pedido sin bloquear el flujo: `crear` ya degrada con
 * elegancia (loguea y sigue) si Mongo o el socket fallan, así que aquí basta fire-and-forget.
 * @param destinatarioId Id del usuario que recibe la notificación.
 * @param tipo Tipo de notificación (p. ej. PEDIDO_CREADO, PEDIDO_PAGADO...).
 * @param titulo Título corto de la notificación.
 * @param cuerpo Texto descriptivo de la notificación.
 * @param pedidoId Id del pedido relacionado, incluido en los datos de la notificación.
 */
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
  /**
   * Realiza el checkout del carrito del cliente: valida el carrito, la
   * dirección de envío y la disponibilidad de stock, calcula los totales
   * (subtotal, envío y total) y delega la creación atómica del pedido en el
   * repositorio. Finalmente notifica a los diseñadores implicados.
   * @param clienteId Id del cliente que realiza la compra.
   * @param datos Datos validados del checkout (dirección, método de pago, notas).
   * @returns El pedido creado con su detalle completo.
   * @throws ErrorReglaDeNegocio si el carrito está vacío, hay productos inactivos
   *         o no hay stock suficiente.
   * @throws ErrorNoEncontrado si la dirección de envío no existe o no pertenece al cliente.
   */
  async checkout(clienteId: string, datos: DatosCrearPedido): Promise<PedidoDetalle> {
    // 1. Obtener carrito
    const carrito = await repositorioCarrito.buscarDeCliente(clienteId);
    if (!carrito || carrito.items.length === 0) {
      throw new ErrorReglaDeNegocio('El carrito está vacío');
    }

    // 2. Validar dirección de envío: debe existir y pertenecer al cliente autenticado
    // (evita que un cliente use la dirección de otro usuario manipulando el id).
    const direccion = await repositorioDirecciones.buscarPorId(datos.direccionEnvioId);
    if (!direccion || direccion.usuarioId !== clienteId) {
      throw new ErrorNoEncontrado('Dirección de envío');
    }

    // 3. Validar disponibilidad (pre-check antes de la transacción).
    // Esta comprobación se repite dentro de la transacción del repositorio
    // como "safety net" frente a condiciones de carrera, pero hacerla aquí
    // primero permite devolver errores de negocio más descriptivos sin
    // necesidad de abrir una transacción si ya sabemos que va a fallar.
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

    // 4. Calcular totales.
    // El precio unitario de cada línea es el precio base del producto más el
    // ajuste de precio propio de la variante (p. ej. una talla especial puede
    // tener un sobrecoste).
    let subtotal = 0;
    for (const item of carrito.items) {
      const precioUnitario =
        Number(item.variante.producto.precioBase) + Number(item.variante.ajustePrecio);
      subtotal += precioUnitario * item.cantidad;
    }
    // Envío gratuito a partir de un importe mínimo; en caso contrario, coste fijo por defecto.
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

  /**
   * Lista los pedidos visibles para el usuario autenticado según su rol:
   * un cliente ve sus propias compras y un diseñador ve los pedidos en los
   * que tiene líneas (sus ventas).
   * @param usuarioId Id del usuario autenticado.
   * @param rol Rol del usuario (CLIENTE, DISENADOR, ADMIN...).
   * @returns Lista de pedidos correspondiente al rol.
   * @throws ErrorAccesoDenegado si el rol no es CLIENTE ni DISENADOR.
   */
  async listar(usuarioId: string, rol: Rol): Promise<PedidoDetalle[]> {
    if (rol === Rol.CLIENTE) return repositorioPedidos.listarDeCliente(usuarioId);
    if (rol === Rol.DISENADOR) return repositorioPedidos.listarDeDisenador(usuarioId);
    throw new ErrorAccesoDenegado('Solo clientes y diseñadores pueden listar pedidos');
  },

  /**
   * Obtiene el detalle de un pedido comprobando que el usuario autenticado
   * tiene permiso para verlo: debe ser el cliente que lo realizó, un
   * diseñador con líneas en él, o un administrador.
   * @param id Id del pedido.
   * @param usuarioId Id del usuario autenticado.
   * @param rol Rol del usuario autenticado.
   * @returns El detalle del pedido.
   * @throws ErrorNoEncontrado si el pedido no existe.
   * @throws ErrorAccesoDenegado si el usuario no tiene relación con el pedido.
   */
  async obtenerDetalle(id: string, usuarioId: string, rol: Rol): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(id);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    // Comprobación de autorización: tres posibles "vías" de acceso legítimo.
    const esCliente = rol === Rol.CLIENTE && pedido.clienteId === usuarioId;
    const esDisenador =
      rol === Rol.DISENADOR && pedido.lineas.some((l) => l.disenadorId === usuarioId);
    const esAdmin = rol === Rol.ADMIN;

    if (!esCliente && !esDisenador && !esAdmin) {
      throw new ErrorAccesoDenegado('No tienes acceso a este pedido');
    }
    return pedido;
  },

  /**
   * Stub: aprueba el pago de un pedido sin integrarse con una pasarela real.
   * Solo el cliente propietario puede pagar, y únicamente si el pedido está
   * en estado PENDIENTE_PAGO. Tras marcarlo como pagado, notifica a los
   * diseñadores implicados para que puedan aceptar sus líneas.
   * @param id Id del pedido a pagar.
   * @param clienteId Id del cliente autenticado.
   * @returns El pedido actualizado a estado PAGADO.
   * @throws ErrorNoEncontrado si el pedido no existe.
   * @throws ErrorAccesoDenegado si el pedido no pertenece al cliente.
   * @throws ErrorReglaDeNegocio si el pedido no está en estado PENDIENTE_PAGO.
   */
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

  /**
   * Permite a un diseñador aceptar sus líneas dentro de un pedido pagado.
   * Solo se permite si el pedido está en estado PAGADO y el diseñador tiene
   * al menos una línea asignada. Tras aceptar, notifica al cliente.
   * @param pedidoId Id del pedido.
   * @param disenadorId Id del diseñador que acepta sus líneas.
   * @returns El pedido actualizado (puede pasar a ACEPTADO si todas las líneas lo están).
   * @throws ErrorNoEncontrado si el pedido no existe.
   * @throws ErrorReglaDeNegocio si el pedido no está en estado PAGADO.
   * @throws ErrorAccesoDenegado si el diseñador no tiene líneas en el pedido.
   */
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

  /**
   * Cancela un pedido y restaura el stock de sus variantes. Solo el cliente
   * propietario o un administrador pueden cancelar, y solo si el pedido se
   * encuentra en un estado cancelable (PENDIENTE_PAGO o PAGADO).
   * @param id Id del pedido a cancelar.
   * @param usuarioId Id del usuario autenticado.
   * @param rol Rol del usuario autenticado.
   * @returns El pedido actualizado a estado CANCELADO.
   * @throws ErrorNoEncontrado si el pedido no existe.
   * @throws ErrorAccesoDenegado si el usuario no es el cliente propietario ni un admin.
   * @throws ErrorReglaDeNegocio si el pedido no está en un estado cancelable.
   */
  async cancelar(id: string, usuarioId: string, rol: Rol): Promise<PedidoDetalle> {
    const pedido = await repositorioPedidos.buscarPorId(id);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    const esCliente = rol === Rol.CLIENTE && pedido.clienteId === usuarioId;
    if (!esCliente && rol !== Rol.ADMIN) {
      throw new ErrorAccesoDenegado('Solo el cliente o un admin pueden cancelar el pedido');
    }

    // Solo se puede cancelar antes de que el diseñador acepte/prepare el pedido.
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
