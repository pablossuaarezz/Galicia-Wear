"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /usuarios. Repositorio mockeado → sin BBDD real.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/modulos/usuarios/repositorio', () => ({
    repositorioUsuarios: {
        buscarPorId: jest.fn(),
        buscarPorIdActivo: jest.fn(),
        buscarHashContrasena: jest.fn(),
        actualizarCliente: jest.fn(),
        actualizarContrasena: jest.fn(),
        actualizarPreferencias: jest.fn(),
        eliminar: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/usuarios/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoMock = repositorio_1.repositorioUsuarios;
// Token válido firmado con el secreto de desarrollo por defecto
const tokenCliente = jsonwebtoken_1.default.sign({ sub: 'u-cliente-1', correo: 'ana@test.gal', rol: client_1.Rol.CLIENTE }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
// El repositorio usa select explícito, hashContrasena nunca se incluye.
const usuarioBaseSimulado = {
    id: 'u-cliente-1',
    correo: 'ana@test.gal',
    rol: client_1.Rol.CLIENTE,
    correoVerificado: false,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    fechaEliminacion: null,
    cliente: { usuarioId: 'u-cliente-1', nombre: 'Ana', apellidos: 'López', telefono: null, fechaNacimiento: null, preferenciasSostenibilidad: {}, direccionPredeterminadaId: null },
    disenador: null,
};
beforeEach(() => jest.clearAllMocks());
describe('GET /usuarios/yo', () => {
    it('401 sin cabecera Authorization', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/usuarios/yo');
        expect(r.status).toBe(401);
        expect(r.body.codigo).toBe('NO_AUTENTICADO');
    });
    it('200 con token válido y usuario encontrado', async () => {
        repoMock.buscarPorIdActivo.mockResolvedValueOnce(usuarioBaseSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/usuarios/yo')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.usuario.correo).toBe('ana@test.gal');
        expect(r.body.usuario.hashContrasena).toBeUndefined();
    });
    it('404 si el usuario fue eliminado', async () => {
        repoMock.buscarPorIdActivo.mockResolvedValueOnce(null);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/usuarios/yo')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(404);
    });
});
describe('PATCH /usuarios/yo/cliente', () => {
    it('400 si los datos no pasan la validación zod', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/usuarios/yo/cliente')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ nombre: '' }); // nombre vacío → falla min(1)
        expect(r.status).toBe(400);
        expect(r.body.codigo).toBe('ERROR_VALIDACION');
    });
    it('200 actualiza nombre y apellidos correctamente', async () => {
        repoMock.buscarPorIdActivo.mockResolvedValueOnce(usuarioBaseSimulado);
        repoMock.actualizarCliente.mockResolvedValueOnce({
            ...usuarioBaseSimulado,
            cliente: { ...usuarioBaseSimulado.cliente, nombre: 'Ana María' },
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/usuarios/yo/cliente')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ nombre: 'Ana María' });
        expect(r.status).toBe(200);
        expect(r.body.usuario.cliente.nombre).toBe('Ana María');
    });
});
describe('PATCH /usuarios/yo/contrasena', () => {
    it('400 si falta contrasenaNueva', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/usuarios/yo/contrasena')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ contrasenaActual: 'Actual123' });
        expect(r.status).toBe(400);
    });
});
describe('DELETE /usuarios/yo', () => {
    it('204 tras eliminar la cuenta', async () => {
        repoMock.buscarHashContrasena.mockResolvedValueOnce({ hashContrasena: 'x', fechaEliminacion: null });
        repoMock.eliminar.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/usuarios/yo')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(204);
    });
});
describe('PATCH /usuarios/yo/preferencias', () => {
    it('200 actualiza preferencias de sostenibilidad', async () => {
        repoMock.buscarPorIdActivo.mockResolvedValueOnce(usuarioBaseSimulado);
        repoMock.actualizarPreferencias.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/usuarios/yo/preferencias')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ certificados: ['GOTS'], maxKm: 100 });
        expect(r.status).toBe(200);
    });
    it('400 con campo desconocido (strict)', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/usuarios/yo/preferencias')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ campoInexistente: true });
        expect(r.status).toBe(400);
    });
});
//# sourceMappingURL=usuarios.rutas.test.js.map