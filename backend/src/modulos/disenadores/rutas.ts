import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { soloAdmin, soloDisenador } from '../../middlewares/rbac';
import { validar } from '../../middlewares/validacion';
import { controladorDisenadores } from './controlador';
import { dtoSolicitarDisenador, dtoActualizarDisenador, dtoValidarDisenador } from './dto';

export const rutasDisenadores = Router();

/**
 * @openapi
 * /disenadores:
 *   get:
 *     tags: [Diseñadores]
 *     summary: Lista pública de diseñadores validados (paginada)
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: ciudad
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista paginada de diseñadores }
 */
rutasDisenadores.get('/', controladorDisenadores.listar);

/**
 * @openapi
 * /disenadores/solicitar:
 *   post:
 *     tags: [Diseñadores]
 *     summary: Crea el perfil de diseñador del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Perfil de diseñador creado }
 *       409: { description: Ya existe un perfil de diseñador }
 */
rutasDisenadores.post(
  '/solicitar',
  verificarJwt,
  soloDisenador,
  validar(dtoSolicitarDisenador),
  controladorDisenadores.solicitar,
);

/**
 * @openapi
 * /disenadores/yo:
 *   patch:
 *     tags: [Diseñadores]
 *     summary: Actualiza el perfil de marca del diseñador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil actualizado }
 *       404: { description: Perfil no encontrado }
 */
rutasDisenadores.patch(
  '/yo',
  verificarJwt,
  soloDisenador,
  validar(dtoActualizarDisenador),
  controladorDisenadores.actualizarMiPerfil,
);

/**
 * @openapi
 * /disenadores/{id}/validar:
 *   patch:
 *     tags: [Diseñadores]
 *     summary: Admin aprueba o rechaza un perfil de diseñador
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Estado de validación actualizado }
 *       404: { description: Diseñador no encontrado }
 */
rutasDisenadores.patch(
  '/:id/validar',
  verificarJwt,
  soloAdmin,
  validar(dtoValidarDisenador),
  controladorDisenadores.validar,
);

/**
 * @openapi
 * /disenadores/{id}:
 *   get:
 *     tags: [Diseñadores]
 *     summary: Perfil público de un diseñador validado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Perfil del diseñador }
 *       404: { description: Diseñador no encontrado o no validado }
 */
// IMPORTANTE: esta ruta va al final para no capturar /solicitar o /yo
rutasDisenadores.get('/:id', controladorDisenadores.obtener);
