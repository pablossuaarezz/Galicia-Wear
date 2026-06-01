// JUSTIFICACIÓN: capa Controller. Convierte petición HTTP en parámetros del servicio y la
// respuesta del servicio en JSON HTTP. NO contiene lógica de negocio.
import { Request, Response, NextFunction } from 'express';
import { servicioAutenticacion } from './servicio';
import type { DatosLogin, DatosRefresco, DatosRegistro } from './dto';

function extraerContexto(peticion: Request) {
  return {
    agenteUsuario: peticion.header('user-agent') ?? undefined,
    ipOrigen: peticion.ip ?? undefined,
  };
}

export const controladorAutenticacion = {
  async registrar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = peticion.body as DatosRegistro;
      const tokens = await servicioAutenticacion.registrar(datos, extraerContexto(peticion));
      respuesta.status(201).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  async iniciarSesion(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const datos = peticion.body as DatosLogin;
      const tokens = await servicioAutenticacion.iniciarSesion(datos, extraerContexto(peticion));
      respuesta.status(200).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  async refrescar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const { tokenRefresco } = peticion.body as DatosRefresco;
      const tokens = await servicioAutenticacion.refrescarSesion(
        tokenRefresco,
        extraerContexto(peticion),
      );
      respuesta.status(200).json(tokens);
    } catch (error) {
      siguiente(error);
    }
  },

  async cerrarSesion(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const { tokenRefresco } = peticion.body as DatosRefresco;
      await servicioAutenticacion.cerrarSesion(tokenRefresco);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  // Endpoint protegido — devuelve el perfil completo del usuario autenticado.
  async obtenerMiPerfil(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const perfil = await servicioAutenticacion.obtenerPerfil(peticion.usuario!.sub);
      respuesta.status(200).json(perfil);
    } catch (error) {
      siguiente(error);
    }
  },
};
