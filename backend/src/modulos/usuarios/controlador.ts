// Controlador HTTP del módulo de usuarios.
// Gestiona el perfil del usuario autenticado: consulta de perfil, edición de
// datos de cliente, cambio de contraseña, baja de cuenta (GDPR), preferencias
// de sostenibilidad y registro del token de notificaciones push (FCM).

import { Request, Response, NextFunction } from 'express';
import { servicioUsuarios } from './servicio';
import type {
  DatosActualizarPerfilCliente,
  DatosCambiarContrasena,
  DatosActualizarPreferencias,
  DatosTokenFcm,
} from './dto';

export const controladorUsuarios = {
  /**
   * Devuelve el perfil completo del usuario autenticado (datos base más
   * perfil de cliente o de diseñador, según corresponda).
   * @param peticion Request de Express; `peticion.usuario.sub` es el id del usuario autenticado.
   * @param respuesta Responde con 200 y el perfil del usuario.
   */
  async obtenerMiPerfil(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const usuario = await servicioUsuarios.obtenerPerfil(peticion.usuario!.sub);
      respuesta.status(200).json({ usuario });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Actualiza los datos del perfil de cliente del usuario autenticado
   * (nombre, apellidos, teléfono, fecha de nacimiento, avatar).
   * @param peticion Request de Express; `peticion.body` contiene `DatosActualizarPerfilCliente`.
   * @param respuesta Responde con 200 y el perfil actualizado.
   */
  async actualizarMiPerfilCliente(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const usuario = await servicioUsuarios.actualizarPerfilCliente(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
        peticion.body as DatosActualizarPerfilCliente,
      );
      respuesta.status(200).json({ usuario });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Cambia la contraseña del usuario autenticado, verificando previamente
   * la contraseña actual.
   * @param peticion Request de Express; `peticion.body` contiene `DatosCambiarContrasena`.
   * @param respuesta Responde con 204 sin contenido si el cambio se realizó correctamente.
   */
  async cambiarContrasena(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      await servicioUsuarios.cambiarContrasena(
        peticion.usuario!.sub,
        peticion.body as DatosCambiarContrasena,
      );
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Elimina (soft delete, por requisitos de GDPR) la cuenta del usuario autenticado.
   * @param peticion Request de Express; `peticion.usuario.sub` es el id del usuario.
   * @param respuesta Responde con 204 sin contenido.
   */
  async eliminarMiCuenta(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      await servicioUsuarios.eliminarCuenta(peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Actualiza las preferencias de sostenibilidad del cliente autenticado
   * (certificados preferidos, km máximo de origen, ciudad).
   * @param peticion Request de Express; `peticion.body` contiene `DatosActualizarPreferencias`.
   * @param respuesta Responde con 200 y un mensaje de confirmación.
   */
  async actualizarMisPreferencias(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      await servicioUsuarios.actualizarPreferencias(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
        peticion.body as DatosActualizarPreferencias,
      );
      respuesta.status(200).json({ mensaje: 'Preferencias actualizadas' });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Registra (o actualiza) el token de notificaciones push (FCM) del
   * dispositivo del usuario autenticado. Operación "best-effort": si falla
   * el almacenamiento en Mongo, no se propaga el error al cliente.
   * @param peticion Request de Express; `peticion.body` contiene `DatosTokenFcm`.
   * @param respuesta Responde con 204 sin contenido.
   */
  async registrarTokenFcm(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      await servicioUsuarios.registrarTokenFcm(
        peticion.usuario!.sub,
        peticion.body as DatosTokenFcm,
      );
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
