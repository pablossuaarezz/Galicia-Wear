// Acceso a datos del módulo de envíos mediante Prisma.
// Gestiona la entidad Envio (1:1 con Pedido) y, en la operación de
// actualización, sincroniza también el estado de las líneas de pedido (LineaPedido)
// y del propio Pedido cuando el envío cambia a "enviado" o "entregado".
// Todas estas operaciones encadenadas se ejecutan dentro de una transacción
// Prisma (`$transaction`) para garantizar consistencia atómica.
import { Envio, Prisma, EstadoPedido, Transportista } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

/**
 * Datos admitidos para actualizar un envío.
 * - transportista / envioEcologico / numeroSeguimiento / entregaEstimada: datos
 *   informativos del envío que se pueden modificar libremente.
 * - marcarComoEnviado / marcarComoEntregado: flags de transición de estado que,
 *   además de tocar el propio Envio, propagan el cambio a LineaPedido y Pedido.
 */
export interface DatosActualizarEnvio {
  transportista?: Transportista;
  envioEcologico?: boolean;
  numeroSeguimiento?: string;
  entregaEstimada?: Date;
  marcarComoEnviado?: boolean;
  marcarComoEntregado?: boolean;
}

/**
 * Repositorio del módulo de envíos.
 * Encapsula las operaciones de lectura/escritura sobre la tabla `envio` y la
 * sincronización de estado con `lineaPedido` y `pedido`.
 */
export class RepositorioEnvios extends RepositorioBase<Envio> {
  /**
   * Busca un envío por su id propio.
   * @param id id del registro Envio.
   * @returns el envío encontrado, o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<Envio | null> {
    return this.bd.envio.findUnique({ where: { id } });
  }

  /**
   * Busca el envío asociado a un pedido (relación 1:1 Pedido-Envio).
   * @param pedidoId id del pedido.
   * @returns el envío del pedido, o `null` si el pedido aún no tiene envío generado
   *   (p. ej. porque todavía no ha sido aceptado por el diseñador).
   */
  async buscarDePedido(pedidoId: string): Promise<Envio | null> {
    return this.bd.envio.findUnique({ where: { pedidoId } });
  }

  /**
   * Actualiza los datos de un envío y, si corresponde, propaga los cambios de
   * estado a las líneas de pedido del diseñador y al pedido completo.
   *
   * Toda la operación se ejecuta dentro de una transacción (`$transaction`)
   * para evitar estados intermedios inconsistentes (p. ej. que el envío quede
   * marcado como enviado pero las líneas de pedido no se actualicen).
   *
   * @param pedidoId id del pedido cuyo envío se actualiza.
   * @param disenadorId id del diseñador que realiza la actualización; se usa
   *   para limitar las actualizaciones de líneas de pedido a las suyas
   *   (un pedido puede tener líneas de varios diseñadores).
   * @param datos campos a actualizar y/o flags de transición de estado.
   * @returns el envío ya actualizado.
   */
  async actualizar(
    pedidoId: string,
    disenadorId: string,
    datos: DatosActualizarEnvio,
  ): Promise<Envio> {
    return this.bd.$transaction(async (tx) => {
      const datosEnvio: Prisma.EnvioUpdateInput = {};

      // Solo se incluyen en el update los campos realmente enviados (distintos
      // de undefined), para no sobrescribir valores existentes con undefined/null.
      if (datos.transportista !== undefined) datosEnvio.transportista = datos.transportista;
      if (datos.envioEcologico !== undefined) datosEnvio.envioEcologico = datos.envioEcologico;
      if (datos.numeroSeguimiento !== undefined) datosEnvio.numeroSeguimiento = datos.numeroSeguimiento;
      if (datos.entregaEstimada !== undefined) datosEnvio.entregaEstimada = datos.entregaEstimada;

      if (datos.marcarComoEnviado) {
        // Se registra la fecha de envío en el propio registro de Envio.
        datosEnvio.fechaEnvio = new Date();
        // Actualizar líneas del diseñador a ENVIADO
        // Solo se actualizan las líneas de ESTE pedido que pertenecen a este
        // diseñador y que estaban en estado ACEPTADO (evita pisar líneas de
        // otros diseñadores del mismo pedido, o líneas en otro estado).
        await tx.lineaPedido.updateMany({
          where: { pedidoId, disenadorId, estadoLinea: EstadoPedido.ACEPTADO },
          data: { estadoLinea: EstadoPedido.ENVIADO },
        });
        // Si todas las líneas están enviadas → actualizar pedido
        // Se comprueba si queda alguna línea del pedido (de cualquier
        // diseñador) que todavía no esté en ENVIADO; si no queda ninguna,
        // el pedido completo pasa a estado ENVIADO.
        const lineasNoEnviadas = await tx.lineaPedido.count({
          where: { pedidoId, estadoLinea: { not: EstadoPedido.ENVIADO } },
        });
        if (lineasNoEnviadas === 0) {
          await tx.pedido.update({
            where: { id: pedidoId },
            data: { estado: EstadoPedido.ENVIADO },
          });
        }
      }

      if (datos.marcarComoEntregado) {
        // Misma lógica que el bloque anterior, pero para la transición
        // ENVIADO -> ENTREGADO.
        datosEnvio.fechaEntrega = new Date();
        await tx.lineaPedido.updateMany({
          where: { pedidoId, disenadorId, estadoLinea: EstadoPedido.ENVIADO },
          data: { estadoLinea: EstadoPedido.ENTREGADO },
        });
        const lineasNoEntregadas = await tx.lineaPedido.count({
          where: { pedidoId, estadoLinea: { not: EstadoPedido.ENTREGADO } },
        });
        if (lineasNoEntregadas === 0) {
          await tx.pedido.update({
            where: { id: pedidoId },
            data: { estado: EstadoPedido.ENTREGADO },
          });
        }
      }

      // Finalmente se actualiza el propio registro de Envio con los campos
      // informativos y/o las fechas de envío/entrega calculadas arriba.
      return tx.envio.update({ where: { pedidoId }, data: datosEnvio });
    });
  }

  /**
   * Elimina un envío por su id.
   * @param id id del registro Envio a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.envio.delete({ where: { id } });
  }
}

// Instancia única (singleton) del repositorio, reutilizada por el servicio.
export const repositorioEnvios = new RepositorioEnvios();
