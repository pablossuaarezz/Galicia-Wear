// JUSTIFICACIÓN: registra los endpoints del módulo en un router aislado. La aplicación
// los monta bajo `/auth`. Incluye rate-limit específico para login (anti fuerza bruta).
//
// Comentarios JSDoc preparados para Swagger (los lee `swagger-jsdoc` en Fase 2e).
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { entorno } from '../../configuracion/entorno';
import { validar } from '../../middlewares/validacion';
import { verificarJwt } from '../../middlewares/autenticacion';
import { controladorAutenticacion } from './controlador';
import { dtoCierreSesion, dtoLogin, dtoRefresco, dtoRegistro } from './dto';

const limiteLogin = rateLimit({
  windowMs: entorno.RATE_LIMIT_WINDOW_MS,
  max: entorno.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos. Vuelve a intentarlo más tarde.',
    codigo: 'LIMITE_INTENTOS',
  },
});

export const rutasAutenticacion = Router();

/**
 * @openapi
 * /auth/registro:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registra un nuevo usuario (cliente o diseñador)
 *     requestBody: { required: true }
 *     responses:
 *       201: { description: Usuario creado y sesión iniciada }
 *       409: { description: Correo ya en uso }
 */
rutasAutenticacion.post('/registro', validar(dtoRegistro), controladorAutenticacion.registrar);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Inicia sesión con correo y contraseña
 *     responses:
 *       200: { description: Pareja de tokens emitida }
 *       401: { description: Credenciales inválidas }
 *       429: { description: Demasiados intentos }
 */
rutasAutenticacion.post(
  '/login',
  limiteLogin,
  validar(dtoLogin),
  controladorAutenticacion.iniciarSesion,
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renueva la pareja de tokens
 *     responses:
 *       200: { description: Nueva pareja emitida (rotación) }
 *       401: { description: Token inválido, expirado o revocado }
 */
rutasAutenticacion.post('/refresh', validar(dtoRefresco), controladorAutenticacion.refrescar);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cierra la sesión actual revocando el token de refresco
 *     responses:
 *       204: { description: Sesión cerrada }
 */
rutasAutenticacion.post('/logout', validar(dtoCierreSesion), controladorAutenticacion.cerrarSesion);

/**
 * @openapi
 * /auth/yo:
 *   get:
 *     tags: [Autenticación]
 *     summary: Devuelve el perfil del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil del usuario actual }
 *       401: { description: No autenticado }
 */
rutasAutenticacion.get('/yo', verificarJwt, controladorAutenticacion.obtenerMiPerfil);
