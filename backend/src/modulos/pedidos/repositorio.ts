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

// Datos que el servicio le pasa al repositorio para el checkout
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
  async buscarPorId(id: string): Promise<PedidoDetalle | null> {
    return this.bd.pedido.findUnique({
      where: { id },
      select: seleccionDetalle,
    }) as unknown as Promise<PedidoDetalle | null>;
  }

  async listarDeCliente(clienteId: string): Promise<PedidoDetalle[]> {
    return this.bd.pedido.findMany({
      where: { clienteId },
      select: seleccionDetalle,
      orderBy: { fechaCreacion: Prisma.SortOrder.desc },
    }) as unknown as Promise<PedidoDetalle[]>;
  }

  async listarDeDisenador(disenadorId: string): Promise<PedidoDetalle[]> {
    return this.bd.pedido.findMany({
      where: { lineas: { some: { disenadorId } } },
      select: seleccionDetalle,
      orderBy: { fechaCreacion: Prisma.SortOrder.desc },
    }) as unknown as Promise<PedidoDetalle[]>;
  }

  // Listado global para el panel admin (paginado + filtro opcional por estado).
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    estado?: EstadoPedido;
  }): Promise<{ datos: PedidoDetalle[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;
    const condicion = filtros.estado ? { estado: filtros.estado } : {};

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

  // CHECKOUT — transacción ACID completa
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

  // PAGAR (stub) — PENDIENTE_PAGO → PAGADO
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

  // ACEPTAR (diseñador) — sus líneas PAGADO → ACEPTADO; crea Envio stub
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

      const datosActualizacion: Prisma.PedidoUpdateInput = {};
      if (lineasPendientes === 0) {
        datosActualizacion.estado = EstadoPedido.ACEPTADO;
        datosActualizacion.fechaAceptacion = new Date();
      }

      // Crear Envio si no existe (stub — sin tracking)
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

  // CANCELAR — PENDIENTE_PAGO/PAGADO → CANCELADO; restaura stock
  async cancelar(id: string): Promise<PedidoDetalle> {
    return this.bd.$transaction(async (tx) => {
      // Obtener líneas con su variante para restaurar stock
      const lineas = await tx.lineaPedido.findMany({
        where: { pedidoId: id },
        select: { varianteId: true, cantidad: true },
      });

      // Restaurar stock
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

  async eliminar(id: string): Promise<void> {
    await this.bd.pedido.delete({ where: { id } });
  }
}

export const repositorioPedidos = new RepositorioPedidos();
