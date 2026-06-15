// Router montado bajo /productos/:productoId/variantes (mergeParams para heredar el param).
// Define las rutas Express para gestionar las variantes (talla/color/SKU/stock)
// de un producto concreto, encadenando autenticación, autorización por rol
// (solo diseñador) y validación de cuerpo donde corresponda.
import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorVariantes } from './controlador';
import { dtoCrearVariante, dtoActualizarVariante } from './dto';

export const rutasVariantes = Router({ mergeParams: true });

/**
 * @openapi
 * /productos/{productoId}/variantes:
 *   get:
 *     tags: [Variantes]
 *     summary: Lista las variantes de un producto (talla · color · stock)
 *     responses:
 *       200: { description: Lista de variantes }
 */
rutasVariantes.get('/', controladorVariantes.listar);

/**
 * @openapi
 * /productos/{productoId}/variantes:
 *   post:
 *     tags: [Variantes]
 *     summary: Añade una variante al producto (solo el diseñador propietario)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Variante creada }
 *       403: { description: No eres el propietario }
 */
rutasVariantes.post(
  '/',
  verificarJwt,
  soloDisenador,
  validar(dtoCrearVariante),
  controladorVariantes.crear,
);

/**
 * @openapi
 * /productos/{productoId}/variantes/{id}:
 *   patch:
 *     tags: [Variantes]
 *     summary: Actualiza una variante (stock, color, precio…)
 *     security: [{ bearerAuth: [] }]
 */
rutasVariantes.patch(
  '/:id',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarVariante),
  controladorVariantes.actualizar,
);

/**
 * @openapi
 * /productos/{productoId}/variantes/{id}:
 *   delete:
 *     tags: [Variantes]
 *     summary: Elimina una variante
 *     security: [{ bearerAuth: [] }]
 */
rutasVariantes.delete('/:id', verificarJwt, soloDisenador, controladorVariantes.eliminar);
