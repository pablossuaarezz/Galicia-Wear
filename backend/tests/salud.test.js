"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// JUSTIFICACIÓN: smoke test del bootstrap. Garantiza que la aplicación arranca,
// /salud responde, raíz informa y 404 está controlado. Mockeamos Prisma porque no
// queremos depender de Postgres para tests unitarios.
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
describe('GET /salud', () => {
    it('debe responder 200 con estado ok y nombre del servicio', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).get('/salud');
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.estado).toBe('ok');
        expect(respuesta.body.servicio).toBe('galiciawear-backend');
        expect(typeof respuesta.body.marcaTiempo).toBe('string');
    });
});
describe('GET / (raíz)', () => {
    it('debe devolver mensaje informativo sobre el API', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).get('/');
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.mensaje).toMatch(/GaliciaWear/);
    });
});
describe('GET /ruta-inexistente', () => {
    it('debe devolver 404 controlado', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).get('/no-existe-este-endpoint');
        expect(respuesta.status).toBe(404);
        expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
    });
});
describe('GET /api/docs.json (Swagger spec)', () => {
    it('devuelve la especificación OpenAPI 3.0 en JSON', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).get('/api/docs.json');
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.openapi).toBe('3.0.3');
        expect(respuesta.body.info.title).toBe('GaliciaWear API');
        expect(Array.isArray(respuesta.body.tags)).toBe(true);
    });
});
//# sourceMappingURL=salud.test.js.map