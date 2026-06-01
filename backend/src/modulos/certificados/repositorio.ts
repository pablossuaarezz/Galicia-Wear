import { CertificadoSostenibilidad, CodigoCertificado } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

export class RepositorioCertificados extends RepositorioBase<CertificadoSostenibilidad> {
  async buscarPorId(id: string): Promise<CertificadoSostenibilidad | null> {
    return this.bd.certificadoSostenibilidad.findUnique({ where: { id } });
  }

  async buscarPorCodigo(codigo: CodigoCertificado): Promise<CertificadoSostenibilidad | null> {
    return this.bd.certificadoSostenibilidad.findUnique({ where: { codigo } });
  }

  async listar(): Promise<CertificadoSostenibilidad[]> {
    return this.bd.certificadoSostenibilidad.findMany({ orderBy: { codigo: 'asc' } });
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.certificadoSostenibilidad.delete({ where: { id } });
  }
}

export const repositorioCertificados = new RepositorioCertificados();
