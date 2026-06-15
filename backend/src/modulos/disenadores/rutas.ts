// Definición de rutas Express del módulo de diseñadores.
// Conecta cada endpoint con su middleware de autenticación/autorización,
// su validación de cuerpo (zod) mediante `validar(dto)` y su controlador.
// La documentación OpenAPI de cada ruta se genera a partir de los bloques
// de comentarios `@openapi` situados justo encima de cada definición.
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
// Ruta pública (sin autenticación): cualquiera puede consultar el listado de
// diseñadores validados.
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
// Requiere: usuario autenticado (verificarJwt), con rol diseñador (soloDisenador)
// y cuerpo válido según dtoSolicitarDisenador (validar). El orden de los
// middlewares es importante: primero se autentica, luego se autoriza el rol
// y por último se valida el payload antes de llegar al controlador.
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
 *   get:
 *     tags: [Diseñadores]
 *     summary: Devuelve el perfil de diseñador del usuario autenticado (validado o no)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil de diseñador propio }
 *       404: { description: Aún no existe perfil de diseñador }
 */
rutasDisenadores.get('/yo', verificarJwt, soloDisenador, controladorDisenadores.obtenerMio);

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
// Acción administrativa: requiere rol admin (soloAdmin) además de autenticación.
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
// Express resuelve las rutas en orden de declaración; si '/:id' estuviera
// antes, capturaría las peticiones a '/solicitar' y '/yo' como si "id" fuera
// el literal "solicitar" o "yo".
rutasDisenadores.get('/:id', controladorDisenadores.obtener);
