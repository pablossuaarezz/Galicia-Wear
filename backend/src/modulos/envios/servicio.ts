import { z } from 'zod';
import { Envio, Transportista } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioPedidos } from '../pedidos/repositorio';
import { servicioNotificaciones } from '../notificaciones/servicio';
import { repositorioEnvios, type DatosActualizarEnvio } from './repositorio';

// DTO aquí para mantenerlo junto a la lógica de negocio de este módulo
export const dtoActualizarEnvio = z
  .object({
    transportista: z.nativeEnum(Transportista).optional(),
    envioEcologico: z.boolean().optional(),
    numeroSeguimiento: z.string().trim().max(100).optional(),
    entregaEstimada: z.coerce.date().optional(),
    marcarComoEnviado: z.boolean().optional(),
    marcarComoEntregado: z.boolean().optional(),
  })
  .strict();
export type DatosActualizarEnvioDto = z.infer<typeof dtoActualizarEnvio>;

export const servicioEnvios = {
  async obtener(pedidoId: string, usuarioId: string): Promise<Envio> {
    // Cualquier usuario del pedido puede ver el envío
    const pedido = await repositorioPedidos.buscarPorId(pedidoId);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    const tieneAcceso =
      pedido.clienteId === usuarioId ||
      pedido.lineas.some((l) => l.disenadorId === usuarioId);
    if (!tieneAcceso) throw new ErrorAccesoDenegado('No tienes acceso a este pedido');

    const envio = await repositorioEnvios.buscarDePedido(pedidoId);
    if (!envio) throw new ErrorNoEncontrado('Envío');
    return envio;
  },

  async actualizar(
    pedidoId: string,
    disenadorId: string,
    datos: DatosActualizarEnvioDto,
  ): Promise<Envio> {
    const pedido = await repositorioPedidos.buscarPorId(pedidoId);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    const tieneLineas = pedido.lineas.some((l) => l.disenadorId === disenadorId);
    if (!tieneLineas) throw new ErrorAccesoDenegado('No tienes líneas en este pedido');

    const envio = await repositorioEnvios.buscarDePedido(pedidoId);
    if (!envio) throw new ErrorNoEncontrado('Envío — el pedido aún no está aceptado');

    const actualizado = await repositorioEnvios.actualizar(
      pedidoId,
      disenadorId,
      datos as DatosActualizarEnvio,
    );

    // Avisar al cliente del cambio de estado de su envío (no bloqueante).
    if (datos.marcarComoEnviado) {
      void servicioNotificaciones.crear({
        destinatarioId: pedido.clienteId,
        tipo: 'PEDIDO_ENVIADO',
        titulo: 'Pedido enviado',
        cuerpo: `Tu pedido ${pedido.numeroPedido} ya va de camino`,
        datos: { pedidoId },
      });
    }
    if (datos.marcarComoEntregado) {
      void servicioNotificaciones.crear({
        destinatarioId: pedido.clienteId,
        tipo: 'PEDIDO_ENTREGADO',
        titulo: 'Pedido entregado',
        cuerpo: `Tu pedido ${pedido.numeroPedido} ha sido entregado`,
        datos: { pedidoId },
      });
    }

    return actualizado;
  },
};
