// Definición de rutas Express para el recurso /usuarios.
// Todas las rutas operan sobre el usuario autenticado ("/yo") y por tanto
// requieren un JWT válido. Cada ruta valida su cuerpo con el DTO Zod
// correspondiente antes de invocar al controlador.

import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { validar } from '../../middlewares/validacion';
import { controladorUsuarios } from './controlador';
import {
  dtoActualizarPerfilCliente,
  dtoCambiarContrasena,
  dtoActualizarPreferencias,
  dtoTokenFcm,
} from './dto';

export const rutasUsuarios = Router();

// Todos los endpoints de /usuarios requieren autenticación
rutasUsuarios.use(verificarJwt);

/**
 * @openapi
 * /usuarios/yo:
 *   get:
 *     tags: [Usuarios]
 *     summary: Perfil completo del usuario autenticado (con cliente o diseñador)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil del usuario }
 *       401: { description: No autenticado }
 */
rutasUsuarios.get('/yo', controladorUsuarios.obtenerMiPerfil);

/**
 * @openapi
 * /usuarios/yo/cliente:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualiza los datos del perfil de cliente (nombre, apellidos, teléfono, nacimiento)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil actualizado }
 *       403: { description: Solo clientes }
 */
rutasUsuarios.patch(
  '/yo/cliente',
  validar(dtoActualizarPerfilCliente),
  controladorUsuarios.actualizarMiPerfilCliente,
);

/**
 * @openapi
 * /usuarios/yo/contrasena:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Cambia la contraseña del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Contraseña cambiada }
 *       401: { description: Contraseña actual incorrecta }
 */
rutasUsuarios.patch(
  '/yo/contrasena',
  validar(dtoCambiarContrasena),
  controladorUsuarios.cambiarContrasena,
);

/**
 * @openapi
 * /usuarios/yo:
 *   delete:
 *     tags: [Usuarios]
 *     summary: Elimina la cuenta del usuario (GDPR — soft delete)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Cuenta eliminada }
 */
rutasUsuarios.delete('/yo', controladorUsuarios.eliminarMiCuenta);

/**
 * @openapi
 * /usuarios/yo/preferencias:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualiza preferencias de sostenibilidad (solo clientes)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Preferencias actualizadas }
 *       403: { description: Solo clientes }
 */
rutasUsuarios.patch(
  '/yo/preferencias',
  validar(dtoActualizarPreferencias),
  controladorUsuarios.actualizarMisPreferencias,
);

/**
 * @openapi
 * /usuarios/yo/fcm-token:
 *   put:
 *     tags: [Usuarios]
 *     summary: Registra el token FCM del dispositivo para push (best-effort, guardado en Mongo)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Token registrado (o ignorado si Mongo no está disponible) }
 */
rutasUsuarios.put(
  '/yo/fcm-token',
  validar(dtoTokenFcm),
  controladorUsuarios.registrarTokenFcm,
);
