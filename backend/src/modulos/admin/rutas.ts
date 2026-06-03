import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloAdmin } from '../../middlewares/rbac';
import { controladorAdmin } from './controlador';

export const rutasAdmin = Router();

// Todos los endpoints de /admin requieren rol ADMIN
rutasAdmin.use(verificarJwt, soloAdmin);

/**
 * @openapi
 * /admin/estadisticas:
 *   get:
 *     tags: [Admin]
 *     summary: KPIs del dashboard (usuarios, productos, pedidos del mes, ingresos)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Estadísticas generales de la plataforma }
 */
rutasAdmin.get('/estadisticas', controladorAdmin.estadisticas);

/**
 * @openapi
 * /admin/exportar/productos.json:
 *   get:
 *     tags: [Admin]
 *     summary: Exporta el catálogo completo en formato JSON (worker_threads)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Fichero JSON descargable }
 */
rutasAdmin.get('/exportar/productos.json', controladorAdmin.exportarJson);

/**
 * @openapi
 * /admin/exportar/productos.xml:
 *   get:
 *     tags: [Admin]
 *     summary: Exporta el catálogo completo en formato XML (worker_threads)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Fichero XML descargable }
 */
rutasAdmin.get('/exportar/productos.xml', controladorAdmin.exportarXml);

/**
 * @openapi
 * /admin/importar/productos:
 *   post:
 *     tags: [Admin]
 *     summary: Importa productos desde JSON o XML (Content-Type determina el formato)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: string }
 *         application/xml:
 *           schema: { type: string }
 *     responses:
 *       200: { description: Resultado de la importación (creados, actualizados, errores) }
 */
// Body JSON envelope: { "formato": "json"|"xml", "datos": "<contenido>" }
rutasAdmin.post('/importar/productos', controladorAdmin.importar);

/**
 * @openapi
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: Visor de logs de auditoría (MongoDB) — paginado, filtros accion/usuarioId/recurso
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: limite, schema: { type: integer } }
 *       - { in: query, name: accion, schema: { type: string } }
 *       - { in: query, name: usuarioId, schema: { type: string } }
 *       - { in: query, name: recurso, schema: { type: string } }
 *     responses:
 *       200: { description: Lista paginada de logs de actividad }
 */
rutasAdmin.get('/logs', controladorAdmin.logs);

/**
 * @openapi
 * /admin/pedidos:
 *   get:
 *     tags: [Admin]
 *     summary: Listado global de pedidos (paginado, filtro por estado)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: limite, schema: { type: integer } }
 *       - { in: query, name: estado, schema: { type: string } }
 *     responses:
 *       200: { description: Lista paginada de todos los pedidos }
 */
rutasAdmin.get('/pedidos', controladorAdmin.pedidos);

/**
 * @openapi
 * /admin/disenadores:
 *   get:
 *     tags: [Admin]
 *     summary: Listado de diseñadores incluyendo los pendientes de validación
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: limite, schema: { type: integer } }
 *       - { in: query, name: ciudad, schema: { type: string } }
 *       - { in: query, name: validado, schema: { type: boolean } }
 *     responses:
 *       200: { description: Lista paginada de diseñadores }
 */
rutasAdmin.get('/disenadores', controladorAdmin.disenadores);

/**
 * @openapi
 * /admin/productos:
 *   get:
 *     tags: [Admin]
 *     summary: Catálogo completo incluyendo productos inactivos/retirados
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina, schema: { type: integer } }
 *       - { in: query, name: limite, schema: { type: integer } }
 *       - { in: query, name: busqueda, schema: { type: string } }
 *       - { in: query, name: material, schema: { type: string } }
 *       - { in: query, name: activo, schema: { type: boolean } }
 *     responses:
 *       200: { description: Lista paginada de productos (incluye inactivos) }
 */
rutasAdmin.get('/productos', controladorAdmin.productos);

/**
 * @openapi
 * /admin/productos/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Moderar un producto (activar/desactivar, editar) sin ser su propietario
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Producto actualizado }
 *   delete:
 *     tags: [Admin]
 *     summary: Retirar un producto del catálogo (soft-delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Producto retirado }
 */
rutasAdmin.patch('/productos/:id', controladorAdmin.moderarProducto);
rutasAdmin.delete('/productos/:id', controladorAdmin.retirarProducto);
