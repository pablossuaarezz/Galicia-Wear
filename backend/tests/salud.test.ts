// JUSTIFICACIÓN: smoke test del bootstrap. Garantiza que la aplicación arranca,
// /salud responde, raíz informa y 404 está controlado. Mockeamos Prisma porque no
// queremos depender de Postgres para tests unitarios.
jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
}));

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';

describe('GET /salud', () => {
  it('debe responder 200 con estado ok y nombre del servicio', async () => {
    const aplicacion = crearAplicacion();
    const respuesta = await request(aplicacion).get('/salud');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('ok');
    expect(respuesta.body.servicio).toBe('galiciawear-backend');
    expect(typeof respuesta.body.marcaTiempo).toBe('string');
  });
});

describe('GET / (raíz)', () => {
  it('debe devolver mensaje informativo sobre el API', async () => {
    const aplicacion = crearAplicacion();
    const respuesta = await request(aplicacion).get('/');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toMatch(/GaliciaWear/);
  });
});

describe('GET /ruta-inexistente', () => {
  it('debe devolver 404 controlado', async () => {
    const aplicacion = crearAplicacion();
    const respuesta = await request(aplicacion).get('/no-existe-este-endpoint');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
  });
});

describe('GET /api/docs.json (Swagger spec)', () => {
  it('devuelve la especificación OpenAPI 3.0 en JSON', async () => {
    const aplicacion = crearAplicacion();
    const respuesta = await request(aplicacion).get('/api/docs.json');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.openapi).toBe('3.0.3');
    expect(respuesta.body.info.title).toBe('GaliciaWear API');
    expect(Array.isArray(respuesta.body.tags)).toBe(true);
  });
});
