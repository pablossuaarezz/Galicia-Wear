"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /admin.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
// Mock del repositorio admin (estadísticas + listados + moderación)
jest.mock('../src/modulos/admin/repositorio', () => ({
    obtenerEstadisticas: jest.fn(),
    obtenerProductosParaExportar: jest.fn(),
    listarLogs: jest.fn(),
    listarPedidosAdmin: jest.fn(),
    listarDisenadoresAdmin: jest.fn(),
    listarProductosAdmin: jest.fn(),
    moderarProducto: jest.fn(),
    retirarProducto: jest.fn(),
}));
// Mock del exportador (evita crear worker_threads en tests)
jest.mock('../src/modulos/admin/exportacion', () => ({
    exportarProductos: jest.fn(),
}));
// Mock del importador
jest.mock('../src/modulos/admin/importacion', () => ({
    importarProductos: jest.fn(),
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/admin/repositorio");
const exportacion_1 = require("../src/modulos/admin/exportacion");
const importacion_1 = require("../src/modulos/admin/importacion");
const entorno_1 = require("../src/configuracion/entorno");
const estadMock = repositorio_1.obtenerEstadisticas;
const exportMock = exportacion_1.exportarProductos;
const importMock = importacion_1.importarProductos;
const logsMock = repositorio_1.listarLogs;
const pedidosMock = repositorio_1.listarPedidosAdmin;
const disenadoresMock = repositorio_1.listarDisenadoresAdmin;
const productosMock = repositorio_1.listarProductosAdmin;
const moderarMock = repositorio_1.moderarProducto;
const retirarMock = repositorio_1.retirarProducto;
const tokenAdmin = jsonwebtoken_1.default.sign({ sub: 'u-admin-1', correo: 'admin@test.gal', rol: client_1.Rol.ADMIN }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const tokenCliente = jsonwebtoken_1.default.sign({ sub: 'u-cli-1', correo: 'ana@test.gal', rol: client_1.Rol.CLIENTE }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
beforeEach(() => jest.clearAllMocks());
describe('GET /admin/estadisticas', () => {
    it('401 sin autenticación', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/admin/estadisticas');
        expect(r.status).toBe(401);
    });
    it('403 si no es ADMIN', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/estadisticas')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(403);
    });
    it('200 devuelve estadísticas al admin', async () => {
        estadMock.mockResolvedValueOnce({
            totalUsuarios: 10,
            totalClientes: 8,
            totalDisenadores: 2,
            totalDisenadoresPendientes: 1,
            totalProductos: 15,
            totalPedidosMes: 3,
            ingresosMes: '149.70',
            pedidosPorEstado: { PAGADO: 2, ENTREGADO: 1 },
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/estadisticas')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.body.estadisticas.totalUsuarios).toBe(10);
        expect(r.body.estadisticas.totalProductos).toBe(15);
    });
});
describe('GET /admin/exportar/productos.json', () => {
    it('200 devuelve JSON con el catálogo', async () => {
        const jsonEjemplo = JSON.stringify({ version: '1.0', fecha: '2026-05-20', total: 1, productos: [] });
        exportMock.mockResolvedValueOnce(jsonEjemplo);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/exportar/productos.json')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.headers['content-type']).toMatch(/json/);
        expect(exportMock).toHaveBeenCalledWith('json');
    });
});
describe('GET /admin/exportar/productos.xml', () => {
    it('200 devuelve XML con el catálogo', async () => {
        const xmlEjemplo = '<?xml version="1.0"?><galiciawear_export><productos total="0"/></galiciawear_export>';
        exportMock.mockResolvedValueOnce(xmlEjemplo);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/exportar/productos.xml')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.headers['content-type']).toMatch(/xml/);
        expect(exportMock).toHaveBeenCalledWith('xml');
    });
});
describe('POST /admin/importar/productos', () => {
    it('403 si no es admin', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/admin/importar/productos')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .set('Content-Type', 'application/json')
            .send('[]');
        expect(r.status).toBe(403);
    });
    it('200 importa productos desde JSON', async () => {
        importMock.mockResolvedValueOnce({ creados: 2, actualizados: 0, errores: [] });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/admin/importar/productos')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ formato: 'json', datos: JSON.stringify([]) });
        expect(r.status).toBe(200);
        expect(r.body.resultado.creados).toBe(2);
        expect(importMock).toHaveBeenCalledWith(expect.any(String), 'json');
    });
    it('200 importa productos desde XML', async () => {
        importMock.mockResolvedValueOnce({ creados: 1, actualizados: 1, errores: [] });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/admin/importar/productos')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ formato: 'xml', datos: '<galiciawear_export><productos/></galiciawear_export>' });
        expect(r.status).toBe(200);
        expect(importMock).toHaveBeenCalledWith(expect.any(String), 'xml');
    });
});
describe('GET /admin/logs', () => {
    it('403 si no es admin', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/logs')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(403);
    });
    it('200 devuelve logs paginados al admin', async () => {
        logsMock.mockResolvedValueOnce({
            datos: [{ accion: 'LOGIN', recurso: 'usuario', fechaCreacion: new Date().toISOString() }],
            total: 1,
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/logs?accion=LOGIN')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.body.logs).toHaveLength(1);
        expect(r.body.total).toBe(1);
        expect(logsMock).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN', pagina: 1 }));
    });
});
describe('GET /admin/pedidos', () => {
    it('200 lista todos los pedidos para el admin', async () => {
        pedidosMock.mockResolvedValueOnce({ datos: [{ id: 'p1', numeroPedido: 'GW-2026-00001' }], total: 1 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/pedidos?estado=PAGADO')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.body.pedidos).toHaveLength(1);
        expect(pedidosMock).toHaveBeenCalledWith(expect.objectContaining({ estado: 'PAGADO' }));
    });
});
describe('GET /admin/disenadores', () => {
    it('200 incluye pendientes cuando validado=false', async () => {
        disenadoresMock.mockResolvedValueOnce({ datos: [{ usuarioId: 'd1', validado: false }], total: 1 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/disenadores?validado=false')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.body.disenadores[0].validado).toBe(false);
        expect(disenadoresMock).toHaveBeenCalledWith(expect.objectContaining({ validado: false }));
    });
});
describe('GET /admin/productos', () => {
    it('200 lista productos incluyendo inactivos', async () => {
        productosMock.mockResolvedValueOnce({ datos: [{ id: 'pr1', activo: false }], total: 1 });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/admin/productos?activo=false')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(200);
        expect(r.body.productos[0].activo).toBe(false);
        expect(productosMock).toHaveBeenCalledWith(expect.objectContaining({ activo: false }));
    });
});
describe('PATCH /admin/productos/:id', () => {
    it('200 modera (desactiva) un producto', async () => {
        moderarMock.mockResolvedValueOnce({ id: 'pr1', activo: false });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/admin/productos/pr1')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ activo: false });
        expect(r.status).toBe(200);
        expect(r.body.producto.activo).toBe(false);
        expect(moderarMock).toHaveBeenCalledWith('pr1', { activo: false });
    });
});
describe('DELETE /admin/productos/:id', () => {
    it('204 retira un producto', async () => {
        retirarMock.mockResolvedValueOnce(undefined);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .delete('/admin/productos/pr1')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(r.status).toBe(204);
        expect(retirarMock).toHaveBeenCalledWith('pr1');
    });
});
//# sourceMappingURL=admin.rutas.test.js.map