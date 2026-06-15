// Definición de rutas Express para el recurso /productos.
// Incluye el catálogo público, la gestión del catálogo propio del diseñador
// y el montaje de los sub-routers de variantes e imágenes anidados bajo
// /productos/:productoId/.

import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorProductos } from './controlador';
import { dtoCrearProducto, dtoActualizarProducto } from './dto';
import { rutasVariantes } from '../variantes/rutas';
import { rutasImagenes } from '../imagenes/rutas';

export const rutasProductos = Router();

// ---- Rutas de nivel raíz (/productos) ----

/**
 * @openapi
 * /productos:
 *   get:
 *     tags: [Productos]
 *     summary: Lista paginada de productos activos con filtros de sostenibilidad
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema: { type: string }
 *       - in: query
 *         name: material
 *         schema: { type: string }
 *       - in: query
 *         name: ciudad
 *         schema: { type: string }
 *       - in: query
 *         name: maxKm
 *         schema: { type: integer }
 *       - in: query
 *         name: certificado
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista paginada de productos }
 */
rutasProductos.get('/', controladorProductos.listar);

/**
 * @openapi
 * /productos:
 *   post:
 *     tags: [Productos]
 *     summary: Crea un nuevo producto (solo el diseñador propietario)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Producto creado }
 */
rutasProductos.post(
  '/',
  verificarJwt,
  soloDisenador,
  validar(dtoCrearProducto),
  controladorProductos.crear,
);

/**
 * @openapi
 * /productos/mios:
 *   get:
 *     tags: [Productos]
 *     summary: Lista los productos del diseñador autenticado (incluye inactivos)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Catálogo propio del diseñador }
 */
// IMPORTANTE: va antes de get('/:slug') para que "mios" no se interprete como slug.
rutasProductos.get('/mios', verificarJwt, soloDisenador, controladorProductos.listarMios);

/**
 * @openapi
 * /productos/mios/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Detalle de una prenda propia del diseñador (incluye inactivas)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Detalle de la prenda }
 *       403: { description: No eres el propietario }
 *       404: { description: Prenda no encontrada }
 */
rutasProductos.get('/mios/:id', verificarJwt, soloDisenador, controladorProductos.obtenerMia);

// ---- Sub-rutas nested (/productos/:productoId/variantes e /imagenes) ----
// IMPORTANTE: los use() con parámetros van ANTES de get('/:slug') para que Express
// no intente capturar el segmento compuesto como un slug de un solo segmento.
rutasProductos.use('/:productoId/variantes', rutasVariantes);
rutasProductos.use('/:productoId/imagenes', rutasImagenes);

/**
 * @openapi
 * /productos/{slug}:
 *   get:
 *     tags: [Productos]
 *     summary: Detalle completo de un producto por slug (variantes + imágenes + certificados)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Producto encontrado }
 *       404: { description: Producto no encontrado o inactivo }
 */
rutasProductos.get('/:slug', controladorProductos.obtener);

/**
 * @openapi
 * /productos/{id}:
 *   patch:
 *     tags: [Productos]
 *     summary: Actualiza un producto del diseñador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Producto actualizado }
 *       403: { description: No eres el propietario }
 */
rutasProductos.patch(
  '/:id',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarProducto),
  controladorProductos.actualizar,
);

/**
 * @openapi
 * /productos/{id}:
 *   delete:
 *     tags: [Productos]
 *     summary: Desactiva un producto (soft delete — activo=false)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Producto desactivado }
 */
rutasProductos.delete('/:id', verificarJwt, soloDisenador, controladorProductos.eliminar);
