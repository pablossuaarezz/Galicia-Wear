import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { validar } from '../../middlewares/validacion';
import { controladorDirecciones } from './controlador';
import { dtoCrearDireccion, dtoActualizarDireccion } from './dto';

export const rutasDirecciones = Router();

// Todos los endpoints de /direcciones requieren autenticación
rutasDirecciones.use(verificarJwt);

/**
 * @openapi
 * /direcciones:
 *   get:
 *     tags: [Direcciones]
 *     summary: Lista las direcciones del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de direcciones }
 */
rutasDirecciones.get('/', controladorDirecciones.listar);

/**
 * @openapi
 * /direcciones:
 *   post:
 *     tags: [Direcciones]
 *     summary: Crea una nueva dirección para el usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Dirección creada }
 *       400: { description: Datos inválidos }
 */
rutasDirecciones.post('/', validar(dtoCrearDireccion), controladorDirecciones.crear);

/**
 * @openapi
 * /direcciones/{id}:
 *   patch:
 *     tags: [Direcciones]
 *     summary: Actualiza una dirección del usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dirección actualizada }
 *       403: { description: No autorizado }
 *       404: { description: Dirección no encontrada }
 */
rutasDirecciones.patch('/:id', validar(dtoActualizarDireccion), controladorDirecciones.actualizar);

/**
 * @openapi
 * /direcciones/{id}:
 *   delete:
 *     tags: [Direcciones]
 *     summary: Elimina una dirección del usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Dirección eliminada }
 *       403: { description: No autorizado }
 */
rutasDirecciones.delete('/:id', controladorDirecciones.eliminar);

/**
 * @openapi
 * /direcciones/{id}/principal:
 *   patch:
 *     tags: [Direcciones]
 *     summary: Marca esta dirección como la dirección principal del usuario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dirección marcada como principal }
 */
rutasDirecciones.patch('/:id/principal', controladorDirecciones.marcarPrincipal);
