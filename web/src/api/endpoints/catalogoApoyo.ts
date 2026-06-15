// Endpoints de apoyo al catálogo: certificados de sostenibilidad. Envuelto en { certificados }.
// Recurso de solo lectura que expone el catálogo de certificados ecológicos (GOTS, OEKO-TEX,
// etc.) usados para etiquetar prendas y filtrar el catálogo por criterios de sostenibilidad.
// Son datos prácticamente estáticos, idóneos para cachear con un staleTime alto en React Query.
import { solicitar } from '../clienteApi';
import type { Certificado } from '../tipos';

/**
 * Cliente de los endpoints del catálogo de certificados de sostenibilidad (solo lectura).
 */
export const apiCertificados = {
  /**
   * Lista todos los certificados de sostenibilidad disponibles.
   * Endpoint: GET /certificados.
   * @returns Promesa con el array de certificados (se desenvuelve { certificados }).
   */
  async listar(): Promise<Certificado[]> {
    const { certificados } = await solicitar<{ certificados: Certificado[] }>('/certificados');
    return certificados;
  },

  /**
   * Obtiene el detalle de un certificado a partir de su código simbólico.
   * Endpoint: GET /certificados/{codigo}.
   * @param codigo Código del certificado (p. ej. "GOTS", "OEKO_TEX").
   * @returns Promesa con el certificado (se desenvuelve { certificado }).
   */
  async obtener(codigo: string): Promise<Certificado> {
    const { certificado } = await solicitar<{ certificado: Certificado }>(`/certificados/${codigo}`);
    return certificado;
  },
};
