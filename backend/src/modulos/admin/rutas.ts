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
