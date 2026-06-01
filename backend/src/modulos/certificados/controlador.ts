import { Request, Response, NextFunction } from 'express';
import { servicioCertificados } from './servicio';

export const controladorCertificados = {
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const certificados = await servicioCertificados.listar();
      respuesta.status(200).json({ certificados });
    } catch (error) {
      siguiente(error);
    }
  },

  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const certificado = await servicioCertificados.obtenerPorCodigo(peticion.params.codigo);
      respuesta.status(200).json({ certificado });
    } catch (error) {
      siguiente(error);
    }
  },
};
