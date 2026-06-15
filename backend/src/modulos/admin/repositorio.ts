// Capa de repositorio del módulo de administración: agrega consultas de estadísticas
// del dashboard, la consulta de productos para exportación, el visor de logs de
// auditoría (MongoDB) y los listados administrativos globales, que en su mayoría
// delegan en los repositorios de los módulos de dominio (productos, pedidos, diseñadores).
import { Prisma, EstadoPedido } from '@prisma/client';
import { prisma } from '../../utilidades/prisma';
import { ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioProductos, type ProductoDetalle } from '../productos/repositorio';
import { repositorioPedidos } from '../pedidos/repositorio';
import { repositorioDisenadores } from '../disenadores/repositorio';
import { ActividadLog } from '../mongo/esquemas/actividadLog';
import type {
  FiltrosLogs,
  FiltrosPedidosAdmin,
  FiltrosDisenadoresAdmin,
  FiltrosProductosAdmin,
} from './dto';
import type { DatosActualizarProducto } from '../productos/dto';

// ---- Estadísticas del dashboard ----

/** Conjunto de KPIs mostrados en el panel de administración. */
export interface EstadisticasAdmin {
  /** Total de usuarios activos (no eliminados) en el sistema. */
  totalUsuarios: number;
  /** Total de perfiles de cliente registrados. */
  totalClientes: number;
  /** Total de diseñadores ya validados por el equipo de administración. */
  totalDisenadores: number;
  /** Total de diseñadores pendientes de validación. */
  totalDisenadoresPendientes: number;
  /** Total de productos activos en el catálogo. */
  totalProductos: number;
  /** Número de pedidos creados durante el mes en curso. */
  totalPedidosMes: number;
  /** Suma de los importes de los pedidos del mes, excluyendo cancelados/devueltos. */
  ingresosMes: Prisma.Decimal;
  /** Número de pedidos agrupados por su estado actual (histórico completo). */
  pedidosPorEstado: Partial<Record<EstadoPedido, number>>;
}

/**
 * Calcula los KPIs del panel de administración (usuarios, diseñadores, productos,
 * pedidos del mes en curso, ingresos del mes y distribución de pedidos por estado).
 *
 * Todas las consultas se ejecutan en paralelo con `Promise.all` para minimizar la
 * latencia total, ya que son independientes entre sí.
 *
 * @returns Objeto {@link EstadisticasAdmin} con todos los indicadores calculados.
 */
export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  // Se calcula el primer instante del mes actual (día 1 a las 00:00:00.000) para
  // filtrar los pedidos "del mes" de forma consistente.
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
    // Se recuperan solo los campos necesarios (total y estado) de los pedidos
    // del mes en curso para calcular el conteo y los ingresos en memoria.
    prisma.pedido.findMany({
      where: { fechaCreacion: { gte: inicioDeMes } },
      select: { total: true, estado: true },
    }),
    // Agregación a nivel de BBDD: cuenta cuántos pedidos hay por cada estado,
    // sobre el histórico completo (no solo el mes en curso).
    prisma.pedido.groupBy({ by: ['estado'], _count: { _all: true } }),
  ]);

  const totalPedidosMes = pedidosMes.length;
  // Los ingresos del mes excluyen pedidos CANCELADO y DEVUELTO, ya que no representan
  // ingresos reales para la plataforma. Se usa Prisma.Decimal para evitar errores
  // de precisión de coma flotante al sumar importes monetarios.
  const ingresosMes = pedidosMes
    .filter((p) => p.estado !== EstadoPedido.CANCELADO && p.estado !== EstadoPedido.DEVUELTO)
    .reduce((suma, p) => suma.add(p.total), new Prisma.Decimal(0));

  // Se transforma el array de resultados de `groupBy` en un mapa estado -> cantidad
  // para que el frontend pueda acceder directamente por clave.
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

/**
 * Obtiene todos los productos activos junto con toda la información relacionada
 * (diseñador, variantes, imágenes y certificados) necesaria para generar el
 * fichero de exportación del catálogo (JSON/XML).
 * @returns Lista de productos con sus relaciones, tipada como {@link ProductoDetalle}.
 */
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
        // Las imágenes marcadas como principales se devuelven primero.
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
    // El `select` anidado de Prisma no coincide exactamente con el tipo ProductoDetalle
    // generado para el módulo de productos (que usa `include`); se fuerza el cast porque
    // la forma resultante es estructuralmente compatible para los fines de exportación.
  }) as unknown as Promise<ProductoDetalle[]>;
}

// ---- Visor de logs de auditoría (MongoDB) ----

/**
 * Lista paginada de logs de actividad almacenados en la colección de MongoDB
 * `ActividadLog`, con filtros opcionales por acción, usuario y recurso.
 * @param filtros Filtros validados ({@link FiltrosLogs}: paginación + accion/usuarioId/recurso).
 * @returns Objeto `{ datos, total }` con los documentos de la página actual y el total que cumple los filtros.
 */
export async function listarLogs(filtros: FiltrosLogs) {
  // Cálculo del offset de Mongo (skip) a partir de la página 1-indexada.
  const omitir = (filtros.pagina - 1) * filtros.limite;
  const condicion: Record<string, unknown> = {};
  // Se construye la condición de búsqueda de Mongo solo con los filtros presentes,
  // de modo que los campos no informados no restrinjan la consulta.
  if (filtros.accion) condicion.accion = filtros.accion;
  if (filtros.usuarioId) condicion.usuarioId = filtros.usuarioId;
  if (filtros.recurso) condicion.recurso = filtros.recurso;

  const [datos, total] = await Promise.all([
    ActividadLog.find(condicion)
      .sort({ fechaCreacion: -1 }) // los más recientes primero
      .skip(omitir)
      .limit(filtros.limite)
      .lean(), // .lean() devuelve objetos planos JS, más rápido al no instanciar documentos Mongoose
    ActividadLog.countDocuments(condicion),
  ]);

  return { datos, total };
}

// ---- Listados globales (delegan en los repositorios de cada módulo) ----

/**
 * Delega en el repositorio de pedidos para obtener el listado global (sin
 * restricción de propiedad) usado por el panel de administración.
 * @param filtros Filtros validados de paginación y estado.
 */
export function listarPedidosAdmin(filtros: FiltrosPedidosAdmin) {
  return repositorioPedidos.listarTodos(filtros);
}

/**
 * Delega en el repositorio de diseñadores para obtener el listado completo,
 * incluyendo diseñadores pendientes de validación.
 * @param filtros Filtros validados de paginación, ciudad y estado de validación.
 */
export function listarDisenadoresAdmin(filtros: FiltrosDisenadoresAdmin) {
  return repositorioDisenadores.listarTodos(filtros);
}

/**
 * Delega en el repositorio de productos para obtener el listado completo del
 * catálogo, incluyendo productos inactivos/retirados.
 * @param filtros Filtros validados de paginación, búsqueda, material y estado activo.
 */
export function listarProductosAdmin(filtros: FiltrosProductosAdmin) {
  return repositorioProductos.listarTodos(filtros);
}

// ---- Moderación de productos por el admin (sin comprobación de propiedad) ----

/**
 * Actualiza un producto en nombre del administrador, sin comprobar que sea el
 * diseñador propietario (a diferencia de la actualización normal del módulo de productos).
 * @param id Identificador del producto a moderar.
 * @param datos Campos a actualizar, validados por `dtoModerarProducto`.
 * @returns El producto actualizado con todos sus detalles.
 * @throws ErrorNoEncontrado si no existe un producto con ese id.
 */
export async function moderarProducto(
  id: string,
  datos: DatosActualizarProducto,
): Promise<ProductoDetalle> {
  const existe = await repositorioProductos.buscarPorId(id);
  if (!existe) throw new ErrorNoEncontrado('Producto');
  return repositorioProductos.actualizar(id, datos);
}

/**
 * Retira un producto del catálogo mediante soft-delete (marca `activo=false`
 * en lugar de borrar el registro), preservando la integridad referencial con
 * pedidos históricos que lo incluyan.
 * @param id Identificador del producto a retirar.
 * @throws ErrorNoEncontrado si no existe un producto con ese id.
 */
export async function retirarProducto(id: string): Promise<void> {
  const existe = await repositorioProductos.buscarPorId(id);
  if (!existe) throw new ErrorNoEncontrado('Producto');
  await repositorioProductos.eliminar(id); // soft-delete (activo=false)
}
