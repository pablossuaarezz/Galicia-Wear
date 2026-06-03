"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /productos/:productoId/variantes.
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
const repositorio_2 = require("../src/modulos/variantes/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoProductosMock = repositorio_1.repositorioProductos;
const repoVariantesMock = repositorio_2.repositorioVariantes;
const tokenDisenador = jsonwebtoken_1.default.sign({ sub: 'u-dis-1', correo: 'dis@test.gal', rol: client_1.Rol.DISENADOR }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const productoSimulado = {
    id: 'prod-1',
    disenadorId: 'u-dis-1',
    nombre: 'Camiseta Lino',
    slug: 'camiseta-lino',
    activo: true,
    disenador: { nombreMarca: 'Liñares Moda', ciudad: client_1.CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
    variantes: [], imagenes: [], certificados: [],
    descripcion: 'desc', precioBase: '29.99', kmOrigen: 15,
    materialPrincipal: client_1.MaterialPrincipal.LINO, fechaCreacion: new Date(), fechaActualizacion: new Date(),
};
const varianteSimulada = {
    id: 'var-1',
    productoId: 'prod-1',
    talla: client_1.TallaPrenda.M,
    color: 'Blanco Natural',
    sku: 'CAM-LINO-M-BLN',
    stock: 10,
    ajustePrecio: '0',
};
beforeEach(() => jest.clearAllMocks());
describe('GET /productos/:productoId/variantes', () => {
    it('200 lista variantes sin autenticación', async () => {
        repoVariantesMock.listarDeProducto.mockResolvedValueOnce([varianteSimulada]);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/productos/prod-1/variantes');
        expect(r.status).toBe(200);
        expect(r.body.variantes[0].sku).toBe('CAM-LINO-M-BLN');
    });
});
describe('POST /productos/:productoId/variantes', () => {
    it('401 sin token', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).post('/productos/prod-1/variantes').send({});
        expect(r.status).toBe(401);
    });
    it('400 si falta la talla', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos/prod-1/variantes')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ color: 'Blanco', sku: 'CAM-M-BLN' }); // falta talla
        expect(r.status).toBe(400);
    });
    it('201 crea variante correctamente', async () => {
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoVariantesMock.crear.mockResolvedValueOnce(varianteSimulada);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos/prod-1/variantes')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ talla: client_1.TallaPrenda.M, color: 'Blanco Natural', sku: 'CAM-LINO-M-BLN', stock: 10 });
        expect(r.status).toBe(201);
        expect(r.body.variante.talla).toBe('M');
    });
    it('403 si no es el propietario del producto', async () => {
        repoProductosMock.buscarPorId.mockResolvedValueOnce({
            ...productoSimulado,
            disenadorId: 'otro-disenador',
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/productos/prod-1/variantes')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ talla: client_1.TallaPrenda.M, color: 'Rojo', sku: 'CAM-M-R', stock: 5 });
        expect(r.status).toBe(403);
    });
});
describe('PATCH /productos/:productoId/variantes/:id', () => {
    it('200 actualiza el stock de la variante', async () => {
        repoVariantesMock.buscarPorId.mockResolvedValueOnce(varianteSimulada);
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoVariantesMock.actualizar.mockResolvedValueOnce({ ...varianteSimulada, stock: 20 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/productos/prod-1/variantes/var-1')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ stock: 20 });
        expect(r.status).toBe(200);
        expect(r.body.variante.stock).toBe(20);
    });
});
describe('DELETE /productos/:productoId/variantes/:id', () => {
    it('204 elimina variante', async () => {
        repoVariantesMock.buscarPorId.mockResolvedValueOnce(varianteSimulada);
        repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado);
        repoVariantesMock.eliminar.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/productos/prod-1/variantes/var-1')
            .set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(204);
    });
});
//# sourceMappingURL=variantes.rutas.test.js.map