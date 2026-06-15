// Repositorio del módulo de pedidos: encapsula todo el acceso a la base de
// datos (vía Prisma) relacionado con la entidad Pedido y sus líneas.
// Contiene las transacciones ACID que cubren el ciclo de vida completo de
// un pedido: checkout (creación + reserva de stock), pago, aceptación por
// parte del diseñador (con creación de envío) y cancelación (con
// restauración de stock).

import {
  Prisma,
  EstadoPedido,
  MetodoPago,
  Transportista,
  TallaPrenda,
} from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { CarritoDetalle } from '../carrito/repositorio';

// ---- Tipos exportados ----

/**
 * Forma completa de un pedido tal y como se devuelve al cliente: incluye
 * los totales, la dirección de envío, todas las líneas (con su variante,
 * producto y diseñador) y, opcionalmente, los datos del envío asociado.
 */
export interface PedidoDetalle {
  id: string;
  numeroPedido: string;
  clienteId: string;
  estado: EstadoPedido;
  subtotal: Prisma.Decimal;
  costeEnvio: Prisma.Decimal;
  total: Prisma.Decimal;
  metodoPago: MetodoPago;
  fechaCreacion: Date;
  fechaPago: Date | null;
  fechaAceptacion: Date | null;
  notas: string | null;
  direccionEnvio: {
    alias: string;
    linea1: string;
    linea2: string | null;
    ciudad: string;
    codigoPostal: string;
    provincia: string;
    pais: string;
  };
  lineas: Array<{
    id: string;
    cantidad: number;
    precioUnitario: Prisma.Decimal;
    estadoLinea: EstadoPedido;
    disenadorId: string;
    variante: {
      talla: TallaPrenda;
      color: string;
      sku: string;
      producto: { nombre: string; slug: string };
    };
    disenador: { nombreMarca: string };
  }>;
  envio: {
    id: string;
    transportista: Transportista;
    envioEcologico: boolean;
    numeroSeguimiento: string | null;
    entregaEstimada: Date | null;
    fechaEnvio: Date | null;
    fechaEntrega: Date | null;
  } | null;
}

/**
 * Datos que el servicio le pasa al repositorio para realizar el checkout:
 * el carrito completo del cliente junto con los totales ya calculados y
 * los datos de envío/pago elegidos.
 */
export interface DatosCheckout {
  carrito: CarritoDetalle;
  clienteId: string;
  subtotal: number;
  costeEnvio: number;
  total: number;
  direccionEnvioId: string;
  metodoPago: MetodoPago;
  notas?: string;
}

// ---- Selección Prisma ----

// Objeto `select` reutilizado en todas las consultas que devuelven un
// PedidoDetalle, de modo que la forma de los datos devueltos por Prisma
// coincida exactamente con la interfaz `PedidoDetalle` definida arriba.
const seleccionDetalle = {
  id: true,
  numeroPedido: true,
  clienteId: true,
  estado: true,
  subtotal: true,
  costeEnvio: true,
  total: true,
  metodoPago: true,
  fechaCreacion: true,
  fechaPago: true,
  fechaAceptacion: true,
  notas: true,
  direccionEnvio: {
    select: {
      alias: true, linea1: true, linea2: true,
      ciudad: true, codigoPostal: true, provincia: true, pais: true,
    },
  },
  lineas: {
    select: {
      id: true,
      cantidad: true,
      precioUnitario: true,
      estadoLinea: true,
      disenadorId: true,
      variante: {
        select: {
          talla: true,
          color: true,
          sku: true,
          producto: { select: { nombre: true, slug: true } },
        },
      },
      disenador: { select: { nombreMarca: true } },
    },
    orderBy: { disenadorId: Prisma.SortOrder.asc },
  },
  envio: {
    select: {
      id: true, transportista: true, envioEcologico: true,
      numeroSeguimiento: true, entregaEstimada: true, fechaEnvio: true, fechaEntrega: true,
    },
  },
};

// ---- Repositorio ----

export class RepositorioPedidos extends RepositorioBase<PedidoDetalle> {
  /**
   * Busca un pedido por su id, devolviendo su detalle completo (líneas,
   * dirección de envío y envío asociado, si existe).
   * @param id Identificador del pedido.
   * @returns El pedido o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<PedidoDetalle | null> {
    return this.bd.pedido.findUnique({
      where: { id },
      select: seleccionDetalle,
    }) as unknown as Promise<PedidoDetalle | null>;
  }

  /**
   * Lista todos los pedidos realizados por un cliente, del más reciente al más antiguo.
   * @param clienteId Identificador del cliente.
   */
  async listarDeCliente(clienteId: string): Promise<PedidoDetalle[]> {
    return this.bd.pedido.findMany({
      where: { clienteId },
      select: seleccionDetalle,
      orderBy: { fechaCreacion: Prisma.SortOrder.desc },
    }) as unknown as Promise<PedidoDetalle[]>;
  }

  /**
   * Lista todos los pedidos en los que un diseñador tiene al menos una línea
   * (es decir, sus "ventas"), del más reciente al más antiguo.
   * @param disenadorId Identificador del diseñador.
   */
  async listarDeDisenador(disenadorId: string): Promise<PedidoDetalle[]> {
    return this.bd.pedido.findMany({
      where: { lineas: { some: { disenadorId } } },
      select: seleccionDetalle,
      orderBy: { fechaCreacion: Prisma.SortOrder.desc },
    }) as unknown as Promise<PedidoDetalle[]>;
  }

  /**
   * Listado global de pedidos para el panel de administración, con
   * paginación y filtro opcional por estado.
   * @param filtros.pagina Página solicitada (1-indexada).
   * @param filtros.limite Tamaño de página.
   * @param filtros.estado Estado por el que filtrar (opcional).
   * @returns Los pedidos de la página solicitada junto con el total de registros que cumplen el filtro.
   */
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    estado?: EstadoPedido;
  }): Promise<{ datos: PedidoDetalle[]; total: number }> {
    // Cálculo del offset de paginación: página 1 -> skip 0, página 2 -> skip `limite`, etc.
    const omitir = (filtros.pagina - 1) * filtros.limite;
    // Si se especifica un estado, se añade como condición; si no, no se filtra por estado.
    const condicion = filtros.estado ? { estado: filtros.estado } : {};

    // Se ejecutan en paralelo la consulta paginada y el conteo total, ya que
    // son independientes y ambas son necesarias para construir la respuesta paginada.
    const [datos, total] = await Promise.all([
      this.bd.pedido.findMany({
        where: condicion,
        select: seleccionDetalle,
        orderBy: { fechaCreacion: Prisma.SortOrder.desc },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.pedido.count({ where: condicion }),
    ]);

    return { datos: datos as unknown as PedidoDetalle[], total };
  }

  /**
   * CHECKOUT — transacción ACID completa que convierte el carrito de un
   * cliente en un pedido. Pasos realizados dentro de la misma transacción:
   * 1. Revalidar el stock de cada variante (defensa frente a condiciones de
   *    carrera con otras compras concurrentes).
   * 2. Generar el número de pedido correlativo `GW-YYYY-NNNNN`.
   * 3. Crear el `Pedido` junto con todas sus `LineaPedido`, calculando el
   *    precio unitario de cada línea (precio base + ajuste de la variante).
   * 4. Decrementar el stock reservado de cada variante comprada.
   * 5. Vaciar el carrito del cliente.
   *
   * Si cualquier paso falla, Prisma revierte toda la transacción, evitando
   * estados inconsistentes (p. ej. stock descontado sin pedido creado).
   * @param datos Carrito, cliente, totales calculados y datos de envío/pago.
   * @returns El pedido recién creado con todo su detalle.
   */
  async crearDesdeCarrito(datos: DatosCheckout): Promise<PedidoDetalle> {
    return this.bd.$transaction(async (tx) => {
      // 1. Verificar stock en tiempo real (safety net contra race conditions)
      for (const item of datos.carrito.items) {
        const variante = await tx.variante.findUnique({ where: { id: item.variante.id } });
        if (!variante || variante.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${item.variante.sku}`);
        }
      }

      // 2. Número de pedido: GW-YYYY-NNNNN
      const cuenta = await tx.pedido.count();
      const numeroPedido = `GW-${new Date().getFullYear()}-${String(cuenta + 1).padStart(5, '0')}`;

      // 3. Crear Pedido con todas sus líneas
      const pedido = await tx.pedido.create({
        data: {
          numeroPedido,
          clienteId: datos.clienteId,
          estado: EstadoPedido.PENDIENTE_PAGO,
          subtotal: datos.subtotal,
          costeEnvio: datos.costeEnvio,
          total: datos.total,
          direccionEnvioId: datos.direccionEnvioId,
          metodoPago: datos.metodoPago,
          notas: datos.notas ?? null,
          lineas: {
            create: datos.carrito.items.map((item) => ({
              varianteId: item.variante.id,
              disenadorId: item.variante.producto.disenadorId,
              cantidad: item.cantidad,
              precioUnitario:
                Number(item.variante.producto.precioBase) +
                Number(item.variante.ajustePrecio),
              estadoLinea: EstadoPedido.PENDIENTE_PAGO,
            })),
          },
        },
        select: seleccionDetalle,
      });

      // 4. Decrementar stock de cada variante
      for (const item of datos.carrito.items) {
        await tx.variante.update({
          where: { id: item.variante.id },
          data: { stock: { decrement: item.cantidad } },
        });
      }

      // 5. Vaciar el carrito
      await tx.itemCarrito.deleteMany({ where: { carritoId: datos.carrito.id } });

      return pedido as unknown as PedidoDetalle;
    });
  }

  /**
   * PAGAR (stub) — marca el pedido y todas sus líneas como PAGADO y registra
   * la fecha de pago. No se integra con ninguna pasarela de pago real: se
   * usa para simular la confirmación del pago en el flujo del TFG.
   * @param id Identificador del pedido.
   * @returns El pedido actualizado con estado PAGADO.
   */
  async marcarComoPagado(id: string): Promise<PedidoDetalle> {
    return this.bd.$transaction(async (tx) => {
      await tx.lineaPedido.updateMany({
        where: { pedidoId: id },
        data: { estadoLinea: EstadoPedido.PAGADO },
      });
      return tx.pedido.update({
        where: { id },
        data: { estado: EstadoPedido.PAGADO, fechaPago: new Date() },
        select: seleccionDetalle,
      }) as unknown as PedidoDetalle;
    });
  }

  /**
   * ACEPTAR (diseñador) — cambia el estado de las líneas de un diseñador
   * concreto de PAGADO a ACEPTADO. Si tras esta operación TODAS las líneas
   * del pedido (de todos los diseñadores) están ACEPTADO, el pedido completo
   * pasa también a ACEPTADO y se registra la fecha de aceptación. Además, se
   * crea un registro de `Envio` stub (sin tracking real) si todavía no existe.
   * @param pedidoId Identificador del pedido.
   * @param disenadorId Identificador del diseñador que acepta sus líneas.
   * @returns El pedido actualizado.
   */
  async aceptarLineas(pedidoId: string, disenadorId: string): Promise<PedidoDetalle> {
    return this.bd.$transaction(async (tx) => {
      // Marcar líneas del diseñador como ACEPTADO
      await tx.lineaPedido.updateMany({
        where: { pedidoId, disenadorId, estadoLinea: EstadoPedido.PAGADO },
        data: { estadoLinea: EstadoPedido.ACEPTADO },
      });

      // Comprobar si TODAS las líneas están ahora aceptadas
      const lineasPendientes = await tx.lineaPedido.count({
        where: { pedidoId, estadoLinea: { not: EstadoPedido.ACEPTADO } },
      });

      // Solo si no quedan líneas pendientes de otros diseñadores se promociona
      // el estado global del pedido a ACEPTADO.
      const datosActualizacion: Prisma.PedidoUpdateInput = {};
      if (lineasPendientes === 0) {
        datosActualizacion.estado = EstadoPedido.ACEPTADO;
        datosActualizacion.fechaAceptacion = new Date();
      }

      // Crear Envio si no existe (stub — sin tracking). Se usa un transportista
      // ecológico por defecto, en línea con la propuesta de valor sostenible del proyecto.
      const envioExistente = await tx.envio.findUnique({ where: { pedidoId } });
      if (!envioExistente) {
        await tx.envio.create({
          data: {
            pedidoId,
            transportista: Transportista.CORREOS_VERDE,
            envioEcologico: true,
          },
        });
      }

      return tx.pedido.update({
        where: { id: pedidoId },
        data: datosActualizacion,
        select: seleccionDetalle,
      }) as unknown as PedidoDetalle;
    });
  }

  /**
   * CANCELAR — cambia el estado del pedido (y de todas sus líneas) a
   * CANCELADO, y restaura el stock de cada variante implicada (lo contrario
   * al decremento realizado durante el checkout).
   * @param id Identificador del pedido.
   * @returns El pedido actualizado con estado CANCELADO.
   */
  async cancelar(id: string): Promise<PedidoDetalle> {
    return this.bd.$transaction(async (tx) => {
      // Obtener líneas con su variante para restaurar stock
      const lineas = await tx.lineaPedido.findMany({
        where: { pedidoId: id },
        select: { varianteId: true, cantidad: true },
      });

      // Restaurar stock: se devuelve a cada variante la cantidad que se
      // había reservado/descontado al crear el pedido.
      for (const linea of lineas) {
        await tx.variante.update({
          where: { id: linea.varianteId },
          data: { stock: { increment: linea.cantidad } },
        });
      }

      // Cancelar todas las líneas
      await tx.lineaPedido.updateMany({
        where: { pedidoId: id },
        data: { estadoLinea: EstadoPedido.CANCELADO },
      });

      return tx.pedido.update({
        where: { id },
        data: { estado: EstadoPedido.CANCELADO },
        select: seleccionDetalle,
      }) as unknown as PedidoDetalle;
    });
  }

  /**
   * Elimina físicamente un pedido de la base de datos (hard delete).
   * @param id Identificador del pedido a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.pedido.delete({ where: { id } });
  }
}

// Instancia única (singleton) del repositorio, usada por el servicio de pedidos.
export const repositorioPedidos = new RepositorioPedidos();
