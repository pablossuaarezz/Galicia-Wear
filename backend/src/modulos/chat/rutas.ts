/**
 * Rutas del módulo Chat.
 *
 * Define el router de Express con los endpoints REST de apoyo al chat de
 * soporte (bandeja de conversaciones, historial de mensajes y marcado de
 * lectura), todos ellos protegidos por el middleware `verificarJwt`. El envío
 * de mensajes en tiempo real se gestiona aparte mediante Socket.IO.
 */
import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { controladorChat } from './controlador';

export const rutasChat = Router();

/**
 * @openapi
 * /chat/conversaciones:
 *   get:
 *     tags: [Chat]
 *     summary: Lista las conversaciones de soporte del usuario (cliente o tienda)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de conversaciones con último mensaje y no leídos }
 */
rutasChat.get('/conversaciones', verificarJwt, controladorChat.listarConversaciones);

/**
 * @openapi
 * /chat/{peerId}/mensajes:
 *   get:
 *     tags: [Chat]
 *     summary: Historial de mensajes con otro usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de mensajes en orden cronológico }
 */
rutasChat.get('/:peerId/mensajes', verificarJwt, controladorChat.historial);

/**
 * @openapi
 * /chat/{peerId}/leer:
 *   patch:
 *     tags: [Chat]
 *     summary: Marca como leídos los mensajes recibidos de un usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Mensajes marcados como leídos }
 */
rutasChat.patch('/:peerId/leer', verificarJwt, controladorChat.marcarLeida);
