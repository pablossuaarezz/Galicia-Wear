import { Request, Response, NextFunction } from 'express';
import { servicioUsuarios } from './servicio';
import type {
  DatosActualizarPerfilCliente,
  DatosCambiarContrasena,
  DatosActualizarPreferencias,
} from './dto';

export const controladorUsuarios = {
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
};
