// Router montado bajo /productos/:productoId/imagenes (mergeParams para heredar el param)
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
rutasImagenes.get('/', controladorImagenes.listar);

/**
 * @openapi
 * /productos/{productoId}/imagenes:
 *   post:
 *     tags: [Imágenes]
 *     summary: Añade una imagen al producto (stub Fase 2c — URL directa; subida real en Fase 6)
 *     security: [{ bearerAuth: [] }]
 */
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
