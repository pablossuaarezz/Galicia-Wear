// Capa Controller del módulo de certificados de sostenibilidad. Endpoints de solo
// lectura (públicos) que permiten consultar el catálogo de certificados (GOTS,
// OEKO-TEX, FAIRTRADE, etc.) y el detalle de uno concreto por su código.
import { Request, Response, NextFunction } from 'express';
import { servicioCertificados } from './servicio';

export const controladorCertificados = {
  /**
   * GET /certificados
   * Devuelve la lista completa de certificados de sostenibilidad disponibles,
   * ordenados por código.
   * @param respuesta Responde 200 con `{ certificados: CertificadoSostenibilidad[] }`.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const certificados = await servicioCertificados.listar();
      respuesta.status(200).json({ certificados });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * GET /certificados/:codigo
   * Devuelve el detalle de un certificado de sostenibilidad concreto a partir
   * de su código (p. ej. GOTS, OEKO_TEX). El código ya ha sido validado por el
   * middleware `validar` con el esquema `dtoCodigoCertificado`.
   * @param peticion.params.codigo Código del certificado (enum CodigoCertificado).
   * @param respuesta Responde 200 con `{ certificado: CertificadoSostenibilidad }`.
   * @throws ErrorNoEncontrado si no existe un certificado con ese código.
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const certificado = await servicioCertificados.obtenerPorCodigo(peticion.params.codigo);
      respuesta.status(200).json({ certificado });
    } catch (error) {
      siguiente(error);
    }
  },
};
