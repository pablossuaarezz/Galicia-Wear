"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /disenadores. Repositorio mockeado → sin BBDD real.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/utilidades/cifrado', () => ({
    cifrarTexto: jest.fn(() => 'iv:tag:datos'),
    descifrarTexto: jest.fn(() => 'ES9121000418450200051332'),
}));
jest.mock('../src/modulos/disenadores/repositorio', () => ({
    repositorioDisenadores: {
        buscarPorId: jest.fn(),
        listar: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        validar: jest.fn(),
        eliminar: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/disenadores/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoMock = repositorio_1.repositorioDisenadores;
const tokenDisenador = jsonwebtoken_1.default.sign({ sub: 'u-disenador-1', correo: 'dis@test.gal', rol: client_1.Rol.DISENADOR }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const tokenAdmin = jsonwebtoken_1.default.sign({ sub: 'u-admin-1', correo: 'admin@test.gal', rol: client_1.Rol.ADMIN }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const disenadorSimulado = {
    usuarioId: 'u-disenador-1',
    nombreMarca: 'Liñares Moda',
    biografia: 'Diseñadora de moda sostenible en A Coruña',
    ciudad: client_1.CiudadGallega.CORUNA,
    validado: true,
    fechaValidacion: new Date(),
    validadoPorId: 'u-admin-1',
    urlLogo: null,
    urlWeb: null,
    fechaCreacion: new Date(),
};
beforeEach(() => jest.clearAllMocks());
describe('GET /disenadores', () => {
    it('200 devuelve lista pública de diseñadores validados', async () => {
        repoMock.listar.mockResolvedValueOnce({ datos: [disenadorSimulado], total: 1 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/disenadores');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.datos)).toBe(true);
        expect(r.body.total).toBe(1);
        expect(r.body.pagina).toBe(1);
    });
    it('200 aplica paginación por query params', async () => {
        repoMock.listar.mockResolvedValueOnce({ datos: [], total: 0 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/disenadores?pagina=2&limite=5');
        expect(r.status).toBe(200);
    });
});
describe('GET /disenadores/:id', () => {
    it('200 devuelve perfil de diseñador validado', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(disenadorSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get(`/disenadores/${disenadorSimulado.usuarioId}`);
        expect(r.status).toBe(200);
        expect(r.body.disenador.nombreMarca).toBe('Liñares Moda');
    });
    it('404 si el diseñador no existe o no está validado', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(null);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/disenadores/id-inexistente');
        expect(r.status).toBe(404);
    });
});
describe('POST /disenadores/solicitar', () => {
    it('401 sin autenticación', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).post('/disenadores/solicitar').send({});
        expect(r.status).toBe(401);
    });
    it('403 si el rol no es DISENADOR', async () => {
        const tokenCliente = jsonwebtoken_1.default.sign({ sub: 'u-1', correo: 'c@test.gal', rol: client_1.Rol.CLIENTE }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/disenadores/solicitar')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({});
        expect(r.status).toBe(403);
    });
    it('400 si faltan campos obligatorios', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/disenadores/solicitar')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ nombreMarca: 'X' }); // bio y ciudad faltan
        expect(r.status).toBe(400);
    });
    it('201 crea el perfil de diseñador correctamente', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(null);
        repoMock.crear.mockResolvedValueOnce({ ...disenadorSimulado, validado: false });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/disenadores/solicitar')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({
            nombreMarca: 'Liñares Moda',
            biografia: 'Diseñadora de moda sostenible en A Coruña con 10 años de experiencia',
            ciudad: client_1.CiudadGallega.CORUNA,
            iban: 'ES9121000418450200051332',
        });
        expect(r.status).toBe(201);
        expect(r.body.disenador.nombreMarca).toBe('Liñares Moda');
    });
});
describe('PATCH /disenadores/yo', () => {
    it('200 actualiza el perfil del diseñador autenticado', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(disenadorSimulado);
        repoMock.actualizar.mockResolvedValueOnce({
            ...disenadorSimulado,
            biografia: 'Nueva biografía extensa del diseñador actualizada',
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/disenadores/yo')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ biografia: 'Nueva biografía extensa del diseñador actualizada' });
        expect(r.status).toBe(200);
    });
});
describe('PATCH /disenadores/:id/validar', () => {
    it('403 si no es admin', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch(`/disenadores/${disenadorSimulado.usuarioId}/validar`)
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ aprobar: true });
        expect(r.status).toBe(403);
    });
    it('200 admin aprueba diseñador', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce({ ...disenadorSimulado, validado: false });
        repoMock.validar.mockResolvedValueOnce(disenadorSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch(`/disenadores/${disenadorSimulado.usuarioId}/validar`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ aprobar: true });
        expect(r.status).toBe(200);
        expect(r.body.disenador.validado).toBe(true);
    });
});
//# sourceMappingURL=disenadores.rutas.test.js.map