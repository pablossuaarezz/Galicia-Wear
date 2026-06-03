"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /productos. Repositorios mockeados → sin BBDD real.
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
// Variantes e imágenes también necesitan estar mockeados porque se importan en rutas
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
const entorno_1 = require("../src/configuracion/entorno");
const repoMock = repositorio_1.repositorioProductos;
const tokenDisenador = jsonwebtoken_1.default.sign({ sub: 'u-dis-1', correo: 'dis@test.gal', rol: client_1.Rol.DISENADOR }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const productoSimulado = {
    id: 'prod-1',
    disenadorId: 'u-dis-1',
    nombre: 'Camiseta Lino Gallego',
    slug: 'camiseta-lino-gallego-abc123',
    descripcion: 'Camiseta fabricada con lino 100% gallego y procesos sin tintes artificiales.',
    precioBase: '29.99',
    kmOrigen: 15,
    materialPrincipal: client_1.MaterialPrincipal.LINO,
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    disenador: { nombreMarca: 'Liñares Moda', ciudad: client_1.CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
    variantes: [],
    imagenes: [],
    certificados: [],
};
beforeEach(() => jest.clearAllMocks());
describe('GET /productos', () => {
    it('200 devuelve lista paginada de productos', async () => {
        repoMock.listar.mockResolvedValueOnce({ datos: [productoSimulado], total: 1 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.datos)).toBe(true);
        expect(r.body.total).toBe(1);
        expect(r.body.pagina).toBe(1);
    });
    it('200 con filtros de sostenibilidad', async () => {
        repoMock.listar.mockResolvedValueOnce({ datos: [], total: 0 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos?material=LINO&maxKm=50&ciudad=CORUNA');
        expect(r.status).toBe(200);
    });
});
describe('GET /productos/:slug', () => {
    it('200 devuelve detalle del producto', async () => {
        repoMock.buscarPorSlug.mockResolvedValueOnce(productoSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos/camiseta-lino-gallego-abc123');
        expect(r.status).toBe(200);
        expect(r.body.producto.nombre).toBe('Camiseta Lino Gallego');
    });
    it('404 si el producto no existe o está inactivo', async () => {
        repoMock.buscarPorSlug.mockResolvedValueOnce(null);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos/slug-inexistente');
        expect(r.status).toBe(404);
    });
});
describe('POST /productos', () => {
    it('401 sin autenticación', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).post('/productos').send({});
        expect(r.status).toBe(401);
    });
    it('400 si faltan campos obligatorios', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ nombre: 'AB' }); // nombre muy corto, falta descripción, precioBase, material
        expect(r.status).toBe(400);
    });
    it('201 crea producto con datos válidos', async () => {
        repoMock.crear.mockResolvedValueOnce(productoSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({
            nombre: 'Camiseta Lino Gallego',
            descripcion: 'Camiseta fabricada con lino 100% gallego y procesos sin tintes artificiales.',
            precioBase: 29.99,
            materialPrincipal: client_1.MaterialPrincipal.LINO,
            kmOrigen: 15,
        });
        expect(r.status).toBe(201);
        expect(r.body.producto.slug).toContain('camiseta');
    });
});
describe('PATCH /productos/:id', () => {
    it('200 actualiza precio correctamente', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoMock.actualizar.mockResolvedValueOnce({ ...productoSimulado, precioBase: '34.99' });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/productos/prod-1')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ precioBase: 34.99 });
        expect(r.status).toBe(200);
    });
    it('403 si no es el propietario', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce({
            ...productoSimulado,
            disenadorId: 'otro-disenador',
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/productos/prod-1')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ precioBase: 34.99 });
        expect(r.status).toBe(403);
    });
});
describe('DELETE /productos/:id', () => {
    it('204 desactiva el producto', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoMock.eliminar.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/productos/prod-1')
            .set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(204);
    });
});
//# sourceMappingURL=productos.rutas.test.js.map