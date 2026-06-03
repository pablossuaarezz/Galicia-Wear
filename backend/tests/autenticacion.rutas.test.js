"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// JUSTIFICACIÓN: tests de integración HTTP de las rutas /auth. Recorren middleware de
// validación + controlador + servicio (con repositorio mockeado). Verifican contratos REST.
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/utilidades/auditoria', () => ({ registrarActividad: jest.fn() }));
jest.mock('../src/modulos/autenticacion/repositorio', () => ({
    repositorioAutenticacion: {
        buscarPorCorreo: jest.fn(),
        buscarPorId: jest.fn(),
        buscarPerfilCompleto: jest.fn(),
        crearUsuario: jest.fn(),
        guardarTokenRefresco: jest.fn(),
        buscarTokenRefrescoPorHash: jest.fn(),
        revocarTokenRefresco: jest.fn(),
        revocarTodosLosTokensDeUsuario: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/autenticacion/repositorio");
const repoMock = repositorio_1.repositorioAutenticacion;
beforeEach(() => jest.clearAllMocks());
describe('POST /auth/registro', () => {
    it('400 si faltan campos obligatorios o son inválidos', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).post('/auth/registro').send({
            correo: 'no-es-un-correo',
            contrasena: '123',
        });
        expect(respuesta.status).toBe(400);
        expect(respuesta.body.codigo).toBe('ERROR_VALIDACION');
        expect(Array.isArray(respuesta.body.detalles)).toBe(true);
    });
    it('409 si el correo ya existe', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce({ id: 'u1' });
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).post('/auth/registro').send({
            correo: 'ana@galiciawear.gal',
            contrasena: 'Segura123',
            nombre: 'Ana',
            apellidos: 'López',
            rol: client_1.Rol.CLIENTE,
        });
        expect(respuesta.status).toBe(409);
        expect(respuesta.body.codigo).toBe('CONFLICTO');
    });
    it('201 con tokens cuando se registra correctamente', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce(null);
        repoMock.crearUsuario.mockResolvedValueOnce({
            id: 'u-nuevo',
            correo: 'ana@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
        });
        repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).post('/auth/registro').send({
            correo: 'ana@galiciawear.gal',
            contrasena: 'Segura123',
            nombre: 'Ana',
            apellidos: 'López',
            rol: client_1.Rol.CLIENTE,
        });
        expect(respuesta.status).toBe(201);
        expect(respuesta.body.tokenAcceso).toBeDefined();
        expect(respuesta.body.tokenRefresco).toBeDefined();
        expect(respuesta.body.usuario.correo).toBe('ana@galiciawear.gal');
    });
});
describe('GET /auth/yo', () => {
    it('401 sin cabecera Bearer', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).get('/auth/yo');
        expect(respuesta.status).toBe(401);
        expect(respuesta.body.codigo).toBe('NO_AUTENTICADO');
    });
    it('401 con token inválido', async () => {
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion)
            .get('/auth/yo')
            .set('Authorization', 'Bearer token-falso');
        expect(respuesta.status).toBe(401);
    });
    it('200 con un token válido emitido por el propio servicio', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce(null);
        repoMock.crearUsuario.mockResolvedValueOnce({
            id: 'u-test',
            correo: 'test@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
        });
        repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);
        // /auth/yo lee el perfil completo del usuario autenticado
        repoMock.buscarPerfilCompleto.mockResolvedValueOnce({
            id: 'u-test',
            correo: 'test@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
            nombre: 'Test',
            apellidos: 'User',
            fechaCreacion: new Date(),
            fechaEliminacion: null,
        });
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        // Primero nos registramos para obtener un tokenAcceso válido
        const respRegistro = await (0, supertest_1.default)(aplicacion).post('/auth/registro').send({
            correo: 'test@galiciawear.gal',
            contrasena: 'Segura123',
            nombre: 'Test',
            apellidos: 'User',
            rol: client_1.Rol.CLIENTE,
        });
        const tokenAcceso = respRegistro.body.tokenAcceso;
        const respYo = await (0, supertest_1.default)(aplicacion)
            .get('/auth/yo')
            .set('Authorization', `Bearer ${tokenAcceso}`);
        expect(respYo.status).toBe(200);
        expect(respYo.body.id).toBe('u-test');
        expect(respYo.body.rol).toBe(client_1.Rol.CLIENTE);
    });
});
describe('POST /auth/logout', () => {
    it('204 cuando se invoca con un token (idempotente)', async () => {
        repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce(null);
        const aplicacion = (0, aplicacion_1.crearAplicacion)();
        const respuesta = await (0, supertest_1.default)(aplicacion).post('/auth/logout').send({
            tokenRefresco: 'cualquier-cosa',
        });
        expect(respuesta.status).toBe(204);
    });
});
//# sourceMappingURL=autenticacion.rutas.test.js.map