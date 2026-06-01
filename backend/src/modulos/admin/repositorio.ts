import { Prisma, EstadoPedido } from '@prisma/client';
import { prisma } from '../../utilidades/prisma';
import type { ProductoDetalle } from '../productos/repositorio';

// ---- Estadísticas del dashboard ----

export interface EstadisticasAdmin {
  totalUsuarios: number;
  totalClientes: number;
  totalDisenadores: number;
  totalDisenadoresPendientes: number;
  totalProductos: number;
  totalPedidosMes: number;
  ingresosMes: Prisma.Decimal;
  pedidosPorEstado: Partial<Record<EstadoPedido, number>>;
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  const [
    totalUsuarios,
    totalClientes,
    totalDisenadores,
    totalDisenadoresPendientes,
    totalProductos,
    pedidosMes,
    agrupadosPorEstado,
  ] = await Promise.all([
    prisma.usuario.count({ where: { fechaEliminacion: null } }),
    prisma.cliente.count(),
    prisma.disenador.count({ where: { validado: true } }),
    prisma.disenador.count({ where: { validado: false } }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.pedido.findMany({
      where: { fechaCreacion: { gte: inicioDeMes } },
      select: { total: true, estado: true },
    }),
    prisma.pedido.groupBy({ by: ['estado'], _count: { _all: true } }),
  ]);

  const totalPedidosMes = pedidosMes.length;
  const ingresosMes = pedidosMes
    .filter((p) => p.estado !== EstadoPedido.CANCELADO && p.estado !== EstadoPedido.DEVUELTO)
    .reduce((suma, p) => suma.add(p.total), new Prisma.Decimal(0));

  const pedidosPorEstado: Partial<Record<EstadoPedido, number>> = {};
  for (const fila of agrupadosPorEstado) {
    pedidosPorEstado[fila.estado] = fila._count._all;
  }

  return {
    totalUsuarios,
    totalClientes,
    totalDisenadores,
    totalDisenadoresPendientes,
    totalProductos,
    totalPedidosMes,
    ingresosMes,
    pedidosPorEstado,
  };
}

// ---- Datos para exportación ----

export async function obtenerProductosParaExportar(): Promise<ProductoDetalle[]> {
  return prisma.producto.findMany({
    where: { activo: true },
    select: {
      id: true,
      disenadorId: true,
      nombre: true,
      slug: true,
      descripcion: true,
      precioBase: true,
      kmOrigen: true,
      materialPrincipal: true,
      activo: true,
      fechaCreacion: true,
      fechaActualizacion: true,
      disenador: { select: { nombreMarca: true, ciudad: true, urlLogo: true, urlWeb: true } },
      variantes: {
        select: { id: true, talla: true, color: true, sku: true, stock: true, ajustePrecio: true },
      },
      imagenes: {
        select: { id: true, url: true, textoAlternativo: true, posicion: true, esPrincipal: true },
        orderBy: [{ esPrincipal: Prisma.SortOrder.desc }],
      },
      certificados: {
        select: {
          numeroCertificado: true,
          fechaEmision: true,
          fechaExpiracion: true,
          certificado: { select: { codigo: true, nombre: true, urlEmisor: true } },
        },
      },
    },
  }) as unknown as Promise<ProductoDetalle[]>;
}
