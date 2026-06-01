import { Request, Response, NextFunction } from 'express';
import { servicioDisenadores } from './servicio';
import {
  dtoFiltrosDisenadores,
  type DatosSolicitarDisenador,
  type DatosActualizarDisenador,
  type DatosValidarDisenador,
} from './dto';

export const controladorDisenadores = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      // Parseamos directamente la query: zod aplica coerciones y defaults.
      const filtros = dtoFiltrosDisenadores.parse(peticion.query);
      const resultado = await servicioDisenadores.listar(filtros);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const disenador = await servicioDisenadores.obtenerPublico(peticion.params.id);
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  async solicitar(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const disenador = await servicioDisenadores.solicitar(
        peticion.usuario!.sub,
        peticion.body as DatosSolicitarDisenador,
      );
      respuesta.status(201).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  async actualizarMiPerfil(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const disenador = await servicioDisenadores.actualizarPropioPerfil(
        peticion.usuario!.sub,
        peticion.body as DatosActualizarDisenador,
      );
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  async validar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const disenador = await servicioDisenadores.validarDisenador(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.body as DatosValidarDisenador,
      );
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },
};
