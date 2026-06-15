// Capa de servicio (lógica de negocio) del módulo de envíos.
// Define el DTO de actualización del envío (zod), aplica las comprobaciones
// de autorización (quién puede ver/modificar el envío de un pedido) y
// dispara notificaciones al cliente cuando el envío cambia de estado
// (enviado / entregado).
import { z } from 'zod';
import { Envio, Transportista } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioPedidos } from '../pedidos/repositorio';
import { servicioNotificaciones } from '../notificaciones/servicio';
import { repositorioEnvios, type DatosActualizarEnvio } from './repositorio';

// DTO aquí para mantenerlo junto a la lógica de negocio de este módulo
/**
 * DTO de validación para la actualización de un envío.
 * - transportista: empresa de transporte (enum Prisma), opcional.
 * - envioEcologico: si se ha elegido la opción de envío ecológico, opcional.
 * - numeroSeguimiento: código de seguimiento del paquete, opcional (máx. 100 caracteres).
 * - entregaEstimada: fecha estimada de entrega; `z.coerce.date()` permite
 *   recibirla como string ISO y convertirla a `Date`.
 * - marcarComoEnviado / marcarComoEntregado: flags que disparan la transición
 *   de estado del pedido/líneas y el envío de notificaciones.
 * `.strict()` rechaza cualquier campo adicional no contemplado.
 */
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
  /**
   * Obtiene el envío asociado a un pedido, comprobando que el usuario
   * solicitante tenga relación con dicho pedido (como cliente o como
   * diseñador con alguna línea en él).
   * @param pedidoId id del pedido.
   * @param usuarioId id del usuario autenticado que realiza la consulta.
   * @returns el envío del pedido.
   * @throws ErrorNoEncontrado si el pedido o el envío no existen.
   * @throws ErrorAccesoDenegado si el usuario no es ni el cliente ni un
   *   diseñador con líneas en el pedido.
   */
  async obtener(pedidoId: string, usuarioId: string): Promise<Envio> {
    // Cualquier usuario del pedido puede ver el envío
    const pedido = await repositorioPedidos.buscarPorId(pedidoId);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    // Autorización: el usuario debe ser el cliente que hizo el pedido, o bien
    // un diseñador que tenga al menos una línea de producto en ese pedido.
    const tieneAcceso =
      pedido.clienteId === usuarioId ||
      pedido.lineas.some((l) => l.disenadorId === usuarioId);
    if (!tieneAcceso) throw new ErrorAccesoDenegado('No tienes acceso a este pedido');

    const envio = await repositorioEnvios.buscarDePedido(pedidoId);
    if (!envio) throw new ErrorNoEncontrado('Envío');
    return envio;
  },

  /**
   * Actualiza el envío de un pedido. Solo puede hacerlo un diseñador con
   * líneas en ese pedido. Si la actualización marca el envío como enviado o
   * entregado, se envía además una notificación al cliente del pedido.
   * @param pedidoId id del pedido cuyo envío se actualiza.
   * @param disenadorId id del diseñador autenticado que realiza la actualización.
   * @param datos datos de actualización ya validados por `dtoActualizarEnvio`.
   * @returns el envío ya actualizado.
   * @throws ErrorNoEncontrado si el pedido no existe o si el envío todavía no
   *   se ha generado (el pedido no ha sido aceptado).
   * @throws ErrorAccesoDenegado si el diseñador no tiene líneas en el pedido.
   */
  async actualizar(
    pedidoId: string,
    disenadorId: string,
    datos: DatosActualizarEnvioDto,
  ): Promise<Envio> {
    const pedido = await repositorioPedidos.buscarPorId(pedidoId);
    if (!pedido) throw new ErrorNoEncontrado('Pedido');

    // Autorización: el diseñador solo puede actualizar el envío si tiene al
    // menos una línea de producto suya en este pedido.
    const tieneLineas = pedido.lineas.some((l) => l.disenadorId === disenadorId);
    if (!tieneLineas) throw new ErrorAccesoDenegado('No tienes líneas en este pedido');

    const envio = await repositorioEnvios.buscarDePedido(pedidoId);
    // Si el pedido aún no ha sido aceptado, no existe registro de Envio todavía.
    if (!envio) throw new ErrorNoEncontrado('Envío — el pedido aún no está aceptado');

    const actualizado = await repositorioEnvios.actualizar(
      pedidoId,
      disenadorId,
      datos as DatosActualizarEnvio,
    );

    // Avisar al cliente del cambio de estado de su envío (no bloqueante).
    // Se usa `void` para no esperar (await) la promesa: el envío de la
    // notificación no debe retrasar ni poder hacer fallar la respuesta HTTP
    // de actualización del envío.
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
