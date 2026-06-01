import { CertificadoSostenibilidad, CodigoCertificado } from '@prisma/client';
import { ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioCertificados } from './repositorio';

export const servicioCertificados = {
  async listar(): Promise<CertificadoSostenibilidad[]> {
    return repositorioCertificados.listar();
  },

  async obtenerPorCodigo(codigo: string): Promise<CertificadoSostenibilidad> {
    const codigoValidado = codigo as CodigoCertificado;
    const certificado = await repositorioCertificados.buscarPorCodigo(codigoValidado);
    if (!certificado) throw new ErrorNoEncontrado('Certificado');
    return certificado;
  },
};
