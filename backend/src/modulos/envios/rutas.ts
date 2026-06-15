// Router montado bajo /pedidos/:pedidoId/envio (mergeParams para heredar el param)
// Define los endpoints de consulta y actualización del envío de un pedido.
// `Router({ mergeParams: true })` es necesario porque este router se monta
// como subruta de /pedidos/:pedidoId, y sin esa opción `params.pedidoId`
// no estaría disponible dentro de este router.
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
// Cualquier usuario autenticado puede llamar a esta ruta; la comprobación de
// si tiene relación con el pedido (cliente o diseñador del mismo) se hace
// dentro del servicio.
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
// Requiere rol diseñador y cuerpo válido según dtoActualizarEnvio antes de
// llegar al controlador.
rutasEnvios.patch(
  '/',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarEnvio),
  controladorEnvios.actualizar,
);
