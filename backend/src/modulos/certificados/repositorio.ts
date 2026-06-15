// Capa de repositorio del módulo de certificados de sostenibilidad. Extiende
// RepositorioBase (que aporta acceso compartido a la instancia de Prisma) y añade
// las consultas específicas sobre la tabla `certificadoSostenibilidad`.
import { CertificadoSostenibilidad, CodigoCertificado } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

/**
 * Repositorio de certificados de sostenibilidad (GOTS, OEKO-TEX, FAIRTRADE, etc.).
 * Hereda de {@link RepositorioBase} para reutilizar la conexión a Prisma (`this.bd`).
 */
export class RepositorioCertificados extends RepositorioBase<CertificadoSostenibilidad> {
  /**
   * Busca un certificado por su identificador interno.
   * @param id Identificador del certificado.
   * @returns El certificado encontrado o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<CertificadoSostenibilidad | null> {
    return this.bd.certificadoSostenibilidad.findUnique({ where: { id } });
  }

  /**
   * Busca un certificado por su código del enum CodigoCertificado (p. ej. GOTS).
   * @param codigo Código del certificado.
   * @returns El certificado encontrado o `null` si no existe.
   */
  async buscarPorCodigo(codigo: CodigoCertificado): Promise<CertificadoSostenibilidad | null> {
    return this.bd.certificadoSostenibilidad.findUnique({ where: { codigo } });
  }

  /**
   * Lista todos los certificados de sostenibilidad disponibles, ordenados
   * alfabéticamente por código.
   * @returns Array con todos los certificados.
   */
  async listar(): Promise<CertificadoSostenibilidad[]> {
    return this.bd.certificadoSostenibilidad.findMany({ orderBy: { codigo: 'asc' } });
  }

  /**
   * Elimina un certificado de la base de datos por su identificador.
   * (No utilizado actualmente por la API pública; pensado para mantenimiento/seed).
   * @param id Identificador del certificado a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.certificadoSostenibilidad.delete({ where: { id } });
  }
}

/** Instancia única (singleton) del repositorio de certificados, usada por el servicio. */
export const repositorioCertificados = new RepositorioCertificados();
