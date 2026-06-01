import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloCliente, soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorPedidos } from './controlador';
import { dtoCrearPedido } from './dto';
import { rutasEnvios } from '../envios/rutas';

export const rutasPedidos = Router();

// Sub-router de envíos nested bajo /:pedidoId/envio
rutasPedidos.use('/:pedidoId/envio', rutasEnvios);

/**
 * @openapi
 * /pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Checkout — crea un pedido desde el carrito (reserva stock, vacía carrito)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Pedido creado en estado PENDIENTE_PAGO }
 *       422: { description: Carrito vacío, stock insuficiente o producto inactivo }
 */
rutasPedidos.post(
  '/',
  verificarJwt,
  soloCliente,
  validar(dtoCrearPedido),
  controladorPedidos.checkout,
);

/**
 * @openapi
 * /pedidos:
 *   get:
 *     tags: [Pedidos]
 *     summary: Lista pedidos propios (cliente: sus compras; diseñador: sus ventas)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de pedidos }
 */
rutasPedidos.get('/', verificarJwt, controladorPedidos.listar);

/**
 * @openapi
 * /pedidos/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Detalle de un pedido con líneas, dirección y envío
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Detalle completo del pedido }
 *       403: { description: No tienes acceso a este pedido }
 */
rutasPedidos.get('/:id', verificarJwt, controladorPedidos.obtener);

/**
 * @openapi
 * /pedidos/{id}/pagar:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Confirma el pago (stub — PENDIENTE_PAGO → PAGADO sin pasarela real)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pedido marcado como PAGADO }
 */
rutasPedidos.patch('/:id/pagar', verificarJwt, soloCliente, controladorPedidos.pagar);

/**
 * @openapi
 * /pedidos/{id}/aceptar:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Diseñador acepta sus líneas del pedido (PAGADO → ACEPTADO); crea envío stub
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Líneas aceptadas; envío creado }
 */
rutasPedidos.patch('/:id/aceptar', verificarJwt, soloDisenador, controladorPedidos.aceptar);

/**
 * @openapi
 * /pedidos/{id}/cancelar:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Cancela el pedido y restaura el stock (solo si PENDIENTE_PAGO o PAGADO)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pedido cancelado y stock restaurado }
 *       422: { description: El pedido no se puede cancelar en el estado actual }
 */
rutasPedidos.patch('/:id/cancelar', verificarJwt, controladorPedidos.cancelar);
