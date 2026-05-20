// JUSTIFICACIÓN: smoke test mínimo de Fase 0. Garantiza que la app arranca y /health responde.
// En Fase 7 esto se completa con tests por módulo (objetivo ≥60% cobertura).
import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /health', () => {
  it('debe responder 200 con estado ok y nombre del servicio', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('galiciawear-backend');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('GET / (raíz)', () => {
  it('debe devolver mensaje informativo sobre el API', async () => {
    const app = createApp();
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/GaliciaWear/);
  });
});

describe('GET /ruta-inexistente', () => {
  it('debe devolver 404 controlado', async () => {
    const app = createApp();
    const res = await request(app).get('/no-existe-este-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
