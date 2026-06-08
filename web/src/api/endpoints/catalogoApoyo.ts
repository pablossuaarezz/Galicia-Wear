// Endpoints de apoyo al catálogo: certificados de sostenibilidad. Envuelto en { certificados }.
import { solicitar } from '../clienteApi';
import type { Certificado } from '../tipos';

export const apiCertificados = {
  async listar(): Promise<Certificado[]> {
    const { certificados } = await solicitar<{ certificados: Certificado[] }>('/certificados');
    return certificados;
  },

  async obtener(codigo: string): Promise<Certificado> {
    const { certificado } = await solicitar<{ certificado: Certificado }>(`/certificados/${codigo}`);
    return certificado;
  },
};
