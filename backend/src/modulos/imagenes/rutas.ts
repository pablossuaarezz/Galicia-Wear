// Router montado bajo /productos/:productoId/imagenes (mergeParams para heredar el param)
// Define los endpoints CRUD de imágenes de un producto, así como el endpoint
// específico para marcar una imagen como principal.
// `Router({ mergeParams: true })` es necesario porque este router se monta
// como subruta de /productos/:productoId, y sin esa opción `params.productoId`
// no estaría disponible dentro de este router.
import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorImagenes } from './controlador';
import { dtoCrearImagen, dtoActualizarImagen } from './dto';

export const rutasImagenes = Router({ mergeParams: true });

/**
 * @openapi
 * /productos/{productoId}/imagenes:
 *   get:
 *     tags: [Imágenes]
 *     summary: Lista las imágenes de un producto
 */
// Ruta pública: cualquiera puede ver las imágenes de un producto (galería del catálogo).
rutasImagenes.get('/', controladorImagenes.listar);

/**
 * @openapi
 * /productos/{productoId}/imagenes:
 *   post:
 *     tags: [Imágenes]
 *     summary: Añade una imagen al producto (stub Fase 2c — URL directa; subida real en Fase 6)
 *     security: [{ bearerAuth: [] }]
 */
// Requiere autenticación, rol diseñador y cuerpo válido (URL directa o base64)
// según dtoCrearImagen antes de llegar al controlador.
rutasImagenes.post(
  '/',
  verificarJwt,
  soloDisenador,
  validar(dtoCrearImagen),
  controladorImagenes.crear,
);

/**
 * @openapi
 * /productos/{productoId}/imagenes/{id}/principal:
 *   patch:
 *     tags: [Imágenes]
 *     summary: Marca una imagen como imagen principal del producto
 *     security: [{ bearerAuth: [] }]
 */
// IMPORTANTE: /principal va antes de /:id para no ser capturada por el param
// Si '/:id' se declarase antes, Express interpretaría "principal" como el
// valor del parámetro `id` en lugar de como un segmento de ruta literal.
rutasImagenes.patch(
  '/:id/principal',
  verificarJwt,
  soloDisenador,
  controladorImagenes.marcarPrincipal,
);

/**
 * @openapi
 * /productos/{productoId}/imagenes/{id}:
 *   patch:
 *     tags: [Imágenes]
 *     summary: Actualiza texto alternativo o posición de una imagen
 *     security: [{ bearerAuth: [] }]
 */
rutasImagenes.patch(
  '/:id',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarImagen),
  controladorImagenes.actualizar,
);

/**
 * @openapi
 * /productos/{productoId}/imagenes/{id}:
 *   delete:
 *     tags: [Imágenes]
 *     summary: Elimina una imagen del producto
 *     security: [{ bearerAuth: [] }]
 */
rutasImagenes.delete('/:id', verificarJwt, soloDisenador, controladorImagenes.eliminar);
