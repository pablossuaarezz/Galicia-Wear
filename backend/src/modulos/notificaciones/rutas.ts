import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { controladorNotificaciones } from './controlador';

export const rutasNotificaciones = Router();

// Toda la bandeja requiere autenticación: un usuario solo ve sus propias notificaciones.
rutasNotificaciones.use(verificarJwt);

/**
 * @openapi
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Bandeja de notificaciones del usuario autenticado (paginada, desc por fecha)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limite, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: "{ notificaciones, total }" }
 */
rutasNotificaciones.get('/', controladorNotificaciones.listar);

/**
 * @openapi
 * /notificaciones/contador:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Número de notificaciones no leídas (para el badge)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ noLeidas }" }
 */
rutasNotificaciones.get('/contador', controladorNotificaciones.contador);

/**
 * @openapi
 * /notificaciones/leer-todas:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marca todas las notificaciones del usuario como leídas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ actualizadas }" }
 */
rutasNotificaciones.patch('/leer-todas', controladorNotificaciones.marcarTodasLeidas);

/**
 * @openapi
 * /notificaciones/{id}/leer:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marca una notificación como leída (solo si es del usuario)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Notificación marcada como leída }
 */
rutasNotificaciones.patch('/:id/leer', controladorNotificaciones.marcarLeida);
