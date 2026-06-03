"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /productos/:productoId/imagenes.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/modulos/productos/repositorio', () => ({
    repositorioProductos: {
        buscarPorId: jest.fn(),
        buscarPorSlug: jest.fn(),
        listar: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        eliminar: jest.fn(),
    },
}));
jest.mock('../src/modulos/variantes/repositorio', () => ({
    repositorioVariantes: {
        buscarPorId: jest.fn(),
        listarDeProducto: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        eliminar: jest.fn(),
    },
}));
jest.mock('../src/modulos/imagenes/repositorio', () => ({
    repositorioImagenes: {
        buscarPorId: jest.fn(),
        listarDeProducto: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        marcarPrincipal: jest.fn(),
        eliminar: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/productos/repositorio");
const repositorio_2 = require("../src/modulos/imagenes/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoProductosMock = repositorio_1.repositorioProductos;
const repoImagenesMock = repositorio_2.repositorioImagenes;
const tokenDisenador = jsonwebtoken_1.default.sign({ sub: 'u-dis-1', correo: 'dis@test.gal', rol: client_1.Rol.DISENADOR }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const productoSimulado = {
    id: 'prod-1', disenadorId: 'u-dis-1', nombre: 'Camiseta', slug: 'camiseta', activo: true,
    disenador: { nombreMarca: 'Liñares Moda', ciudad: client_1.CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
    variantes: [], imagenes: [], certificados: [],
    descripcion: 'desc', precioBase: '29.99', kmOrigen: 15,
    materialPrincipal: client_1.MaterialPrincipal.LINO, fechaCreacion: new Date(), fechaActualizacion: new Date(),
};
const imagenSimulada = {
    id: 'img-1',
    productoId: 'prod-1',
    url: 'https://cdn.galiciawear.gal/camiseta-lino.jpg',
    textoAlternativo: 'Camiseta de lino gallego blanca',
    posicion: 0,
    esPrincipal: true,
};
beforeEach(() => jest.clearAllMocks());
describe('GET /productos/:productoId/imagenes', () => {
    it('200 lista imágenes sin autenticación', async () => {
        repoImagenesMock.listarDeProducto.mockResolvedValueOnce([imagenSimulada]);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos/prod-1/imagenes');
        expect(r.status).toBe(200);
        expect(r.body.imagenes[0].esPrincipal).toBe(true);
    });
});
describe('POST /productos/:productoId/imagenes', () => {
    it('401 sin token', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).post('/productos/prod-1/imagenes').send({});
        expect(r.status).toBe(401);
    });
    it('400 si la URL no es válida', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos/prod-1/imagenes')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ url: 'no-es-una-url' });
        expect(r.status).toBe(400);
    });
    it('201 añade imagen con URL válida', async () => {
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoImagenesMock.crear.mockResolvedValueOnce(imagenSimulada);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos/prod-1/imagenes')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ url: 'https://cdn.galiciawear.gal/camiseta-lino.jpg', esPrincipal: true });
        expect(r.status).toBe(201);
        expect(r.body.imagen.esPrincipal).toBe(true);
    });
});
describe('PATCH /productos/:productoId/imagenes/:id/principal', () => {
    it('200 marca imagen como principal', async () => {
        repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada);
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoImagenesMock.marcarPrincipal.mockResolvedValueOnce({ ...imagenSimulada, esPrincipal: true });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/productos/prod-1/imagenes/img-1/principal')
            .set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(200);
        expect(r.body.imagen.esPrincipal).toBe(true);
    });
});
describe('DELETE /productos/:productoId/imagenes/:id', () => {
    it('204 elimina imagen', async () => {
        repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada);
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoImagenesMock.eliminar.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/productos/prod-1/imagenes/img-1')
            .set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(204);
    });
    it('403 si no es el propietario', async () => {
        repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada);
        repoProductosMock.buscarPorId.mockResolvedValueOnce({
            ...productoSimulado,
            disenadorId: 'otro-disenador',
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/productos/prod-1/imagenes/img-1')
            .set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(403);
    });
});
//# sourceMappingURL=imagenes.rutas.test.js.map