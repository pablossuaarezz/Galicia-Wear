"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /direcciones. Repositorio mockeado → sin BBDD real.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/modulos/direcciones/repositorio', () => ({
    repositorioDirecciones: {
        buscarPorId: jest.fn(),
        listarDeUsuario: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        marcarPrincipal: jest.fn(),
        eliminar: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/direcciones/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoMock = repositorio_1.repositorioDirecciones;
const tokenCliente = jsonwebtoken_1.default.sign({ sub: 'u-cliente-1', correo: 'ana@test.gal', rol: client_1.Rol.CLIENTE }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const direccionSimulada = {
    id: 'dir-1',
    usuarioId: 'u-cliente-1',
    alias: 'Casa',
    linea1: 'Calle Real 15',
    linea2: null,
    ciudad: 'A Coruña',
    codigoPostal: '15001',
    provincia: 'A Coruña',
    pais: 'ES',
    esPrincipal: false,
};
beforeEach(() => jest.clearAllMocks());
describe('GET /direcciones', () => {
    it('401 sin autenticación', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/direcciones');
        expect(r.status).toBe(401);
    });
    it('200 devuelve lista de direcciones del usuario', async () => {
        repoMock.listarDeUsuario.mockResolvedValueOnce([direccionSimulada]);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/direcciones')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.direcciones)).toBe(true);
        expect(r.body.direcciones[0].alias).toBe('Casa');
    });
});
describe('POST /direcciones', () => {
    it('400 si falta codigoPostal o tiene formato incorrecto', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/direcciones')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ alias: 'Casa', linea1: 'Calle Real 15', ciudad: 'A Coruña', codigoPostal: '123' });
        expect(r.status).toBe(400);
        expect(r.body.codigo).toBe('ERROR_VALIDACION');
    });
    it('201 crea dirección con datos válidos', async () => {
        repoMock.crear.mockResolvedValueOnce(direccionSimulada);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/direcciones')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({
            alias: 'Casa',
            linea1: 'Calle Real 15',
            ciudad: 'A Coruña',
            codigoPostal: '15001',
        });
        expect(r.status).toBe(201);
        expect(r.body.direccion.alias).toBe('Casa');
    });
});
describe('DELETE /direcciones/:id', () => {
    it('204 elimina dirección propia', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(direccionSimulada);
        repoMock.eliminar.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/direcciones/dir-1')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(204);
    });
    it('403 si la dirección pertenece a otro usuario', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce({
            ...direccionSimulada,
            usuarioId: 'otro-usuario',
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/direcciones/dir-1')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(403);
    });
});
describe('PATCH /direcciones/:id/principal', () => {
    it('200 marca la dirección como principal', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(direccionSimulada);
        repoMock.marcarPrincipal.mockResolvedValueOnce({
            ...direccionSimulada,
            esPrincipal: true,
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/direcciones/dir-1/principal')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.direccion.esPrincipal).toBe(true);
    });
});
//# sourceMappingURL=direcciones.rutas.test.js.map