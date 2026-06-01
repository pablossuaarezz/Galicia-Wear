import { Envio, Prisma, EstadoPedido, Transportista } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

export interface DatosActualizarEnvio {
  transportista?: Transportista;
  envioEcologico?: boolean;
  numeroSeguimiento?: string;
  entregaEstimada?: Date;
  marcarComoEnviado?: boolean;
  marcarComoEntregado?: boolean;
}

export class RepositorioEnvios extends RepositorioBase<Envio> {
  async buscarPorId(id: string): Promise<Envio | null> {
    return this.bd.envio.findUnique({ where: { id } });
  }

  async buscarDePedido(pedidoId: string): Promise<Envio | null> {
    return this.bd.envio.findUnique({ where: { pedidoId } });
  }

  async actualizar(
    pedidoId: string,
    disenadorId: string,
    datos: DatosActualizarEnvio,
  ): Promise<Envio> {
    return this.bd.$transaction(async (tx) => {
      const datosEnvio: Prisma.EnvioUpdateInput = {};

      if (datos.transportista !== undefined) datosEnvio.transportista = datos.transportista;
      if (datos.envioEcologico !== undefined) datosEnvio.envioEcologico = datos.envioEcologico;
      if (datos.numeroSeguimiento !== undefined) datosEnvio.numeroSeguimiento = datos.numeroSeguimiento;
      if (datos.entregaEstimada !== undefined) datosEnvio.entregaEstimada = datos.entregaEstimada;

      if (datos.marcarComoEnviado) {
        datosEnvio.fechaEnvio = new Date();
        // Actualizar líneas del diseñador a ENVIADO
        await tx.lineaPedido.updateMany({
          where: { pedidoId, disenadorId, estadoLinea: EstadoPedido.ACEPTADO },
          data: { estadoLinea: EstadoPedido.ENVIADO },
        });
        // Si todas las líneas están enviadas → actualizar pedido
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

      return tx.envio.update({ where: { pedidoId }, data: datosEnvio });
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.envio.delete({ where: { id } });
  }
}

export const repositorioEnvios = new RepositorioEnvios();
