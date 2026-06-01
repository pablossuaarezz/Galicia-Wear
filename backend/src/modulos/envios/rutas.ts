// Router montado bajo /pedidos/:pedidoId/envio (mergeParams para heredar el param)
import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorEnvios } from './controlador';
import { dtoActualizarEnvio } from './servicio';

export const rutasEnvios = Router({ mergeParams: true });

/**
 * @openapi
 * /pedidos/{pedidoId}/envio:
 *   get:
 *     tags: [Envíos]
 *     summary: Detalle del envío de un pedido (cliente o diseñador del pedido)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del envío }
 *       404: { description: Envío no encontrado (pedido aún no aceptado) }
 */
rutasEnvios.get('/', verificarJwt, controladorEnvios.obtener);

/**
 * @openapi
 * /pedidos/{pedidoId}/envio:
 *   patch:
 *     tags: [Envíos]
 *     summary: Actualiza datos del envío (tracking, transportista, estado)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Envío actualizado }
 *       403: { description: Solo el diseñador del pedido puede actualizar }
 */
rutasEnvios.patch(
  '/',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarEnvio),
  controladorEnvios.actualizar,
);
