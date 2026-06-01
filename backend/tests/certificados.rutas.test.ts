// Tests de integración HTTP para /certificados. Repositorio mockeado → sin BBDD real.

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
}));

jest.mock('../src/modulos/certificados/repositorio', () => ({
  repositorioCertificados: {
    listar: jest.fn(),
    buscarPorCodigo: jest.fn(),
    buscarPorId: jest.fn(),
    eliminar: jest.fn(),
  },
}));

import request from 'supertest';
import { CodigoCertificado } from '@prisma/client';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioCertificados } from '../src/modulos/certificados/repositorio';

const repoMock = repositorioCertificados as jest.Mocked<typeof repositorioCertificados>;

const certificadoGOTS = {
  id: 'cert-1',
  codigo: CodigoCertificado.GOTS,
  nombre: 'Global Organic Textile Standard',
  descripcion: 'Certificación para textiles fabricados con fibras orgánicas.',
  urlEmisor: 'https://global-standard.org',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /certificados', () => {
  it('200 devuelve lista de todos los certificados', async () => {
    repoMock.listar.mockResolvedValueOnce([certificadoGOTS] as never);
    const app = crearAplicacion();
    const r = await request(app).get('/certificados');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.certificados)).toBe(true);
    expect(r.body.certificados[0].codigo).toBe('GOTS');
  });

  it('200 con lista vacía si no hay datos seed aún', async () => {
    repoMock.listar.mockResolvedValueOnce([]);
    const app = crearAplicacion();
    const r = await request(app).get('/certificados');
    expect(r.status).toBe(200);
    expect(r.body.certificados).toHaveLength(0);
  });
});

describe('GET /certificados/:codigo', () => {
  it('200 devuelve certificado GOTS', async () => {
    repoMock.buscarPorCodigo.mockResolvedValueOnce(certificadoGOTS as never);
    const app = crearAplicacion();
    const r = await request(app).get('/certificados/GOTS');
    expect(r.status).toBe(200);
    expect(r.body.certificado.nombre).toBe('Global Organic Textile Standard');
  });

  it('400 con código desconocido (no pertenece al enum)', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/certificados/CODIGO_FALSO');
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe('ERROR_VALIDACION');
  });

  it('404 si el certificado no existe en BBDD (seed no ejecutado)', async () => {
    repoMock.buscarPorCodigo.mockResolvedValueOnce(null);
    const app = crearAplicacion();
    const r = await request(app).get('/certificados/OEKO_TEX');
    expect(r.status).toBe(404);
  });
});
