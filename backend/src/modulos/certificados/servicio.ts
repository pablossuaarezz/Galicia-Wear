// Capa de servicio (lógica de negocio) del módulo de certificados de sostenibilidad.
// Es una capa muy delgada: delega directamente en el repositorio y solo añade la
// comprobación de existencia al consultar por código.
import { CertificadoSostenibilidad, CodigoCertificado } from '@prisma/client';
import { ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioCertificados } from './repositorio';

export const servicioCertificados = {
  /**
   * Devuelve el listado completo de certificados de sostenibilidad disponibles.
   * @returns Array con todos los certificados, ordenados por código.
   */
  async listar(): Promise<CertificadoSostenibilidad[]> {
    return repositorioCertificados.listar();
  },

  /**
   * Obtiene un certificado de sostenibilidad por su código.
   * @param codigo Código del certificado como string (ya validado por zod en la ruta
   * frente al enum CodigoCertificado, por lo que el cast es seguro).
   * @returns El certificado encontrado.
   * @throws ErrorNoEncontrado si no existe ningún certificado con ese código.
   */
  async obtenerPorCodigo(codigo: string): Promise<CertificadoSostenibilidad> {
    const codigoValidado = codigo as CodigoCertificado;
    const certificado = await repositorioCertificados.buscarPorCodigo(codigoValidado);
    if (!certificado) throw new ErrorNoEncontrado('Certificado');
    return certificado;
  },
};
