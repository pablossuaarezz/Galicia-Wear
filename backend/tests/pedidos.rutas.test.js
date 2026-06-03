"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Tests de integración HTTP para /pedidos.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/prisma', () => ({
    prisma: {},
    cerrarConexionBd: jest.fn(),
}));
jest.mock('../src/modulos/pedidos/repositorio', () => ({
    repositorioPedidos: {
        buscarPorId: jest.fn(),
        listarDeCliente: jest.fn(),
        listarDeDisenador: jest.fn(),
        crearDesdeCarrito: jest.fn(),
        marcarComoPagado: jest.fn(),
        aceptarLineas: jest.fn(),
        cancelar: jest.fn(),
        eliminar: jest.fn(),
    },
}));
jest.mock('../src/modulos/carrito/repositorio', () => ({
    repositorioCarrito: {
        buscarPorId: jest.fn(),
        buscarDeCliente: jest.fn(),
        obtenerOCrear: jest.fn(),
        agregarOActualizarItem: jest.fn(),
        eliminarItem: jest.fn(),
        vaciar: jest.fn(),
        eliminar: jest.fn(),
    },
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
jest.mock('../src/modulos/envios/repositorio', () => ({
    repositorioEnvios: {
        buscarPorId: jest.fn(),
        buscarDePedido: jest.fn(),
        actualizar: jest.fn(),
        eliminar: jest.fn(),
    },
}));
const supertest_1 = __importDefault(require("supertest"));
const aplicacion_1 = require("../src/aplicacion");
const repositorio_1 = require("../src/modulos/pedidos/repositorio");
const repositorio_2 = require("../src/modulos/carrito/repositorio");
const repositorio_3 = require("../src/modulos/direcciones/repositorio");
const entorno_1 = require("../src/configuracion/entorno");
const repoMock = repositorio_1.repositorioPedidos;
const carritoMock = repositorio_2.repositorioCarrito;
const dirMock = repositorio_3.repositorioDirecciones;
const tokenCliente = jsonwebtoken_1.default.sign({ sub: 'u-cli-1', correo: 'ana@test.gal', rol: client_1.Rol.CLIENTE }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const tokenDisenador = jsonwebtoken_1.default.sign({ sub: 'u-dis-1', correo: 'dis@test.gal', rol: client_1.Rol.DISENADOR }, entorno_1.entorno.JWT_SECRET, { expiresIn: '1h' });
const pedidoSimulado = {
    id: 'ped-1',
    numeroPedido: 'GW-2026-00001',
    clienteId: 'u-cli-1',
    estado: client_1.EstadoPedido.PENDIENTE_PAGO,
    subtotal: '34.90',
    costeEnvio: '4.90',
    total: '39.80',
    metodoPago: client_1.MetodoPago.TARJETA,
    fechaCreacion: new Date(),
    fechaPago: null,
    fechaAceptacion: null,
    notas: null,
    direccionEnvio: { alias: 'Casa', linea1: 'Calle Real 1', linea2: null, ciudad: 'A Coruña', codigoPostal: '15001', provincia: 'A Coruña', pais: 'ES' },
    lineas: [
        {
            id: 'lin-1',
            cantidad: 1,
            precioUnitario: '34.90',
            estadoLinea: client_1.EstadoPedido.PENDIENTE_PAGO,
            disenadorId: 'u-dis-1',
            variante: { talla: 'M', color: 'Natural', sku: 'CLI-LINO-M-NC', producto: { nombre: 'Camiseta Lino', slug: 'camiseta-lino' } },
            disenador: { nombreMarca: 'Liñares Moda' },
        },
    ],
    envio: null,
};
const carritoConItems = {
    id: 'cart-1',
    clienteId: 'u-cli-1',
    fechaActualizacion: new Date(),
    items: [
        {
            id: 'item-1',
            cantidad: 1,
            fechaAnadido: new Date(),
            variante: {
                id: 'var-1',
                talla: 'M',
                color: 'Natural',
                sku: 'CLI-LINO-M-NC',
                stock: 10,
                ajustePrecio: '0',
                producto: {
                    id: 'prod-1',
                    disenadorId: 'u-dis-1',
                    nombre: 'Camiseta Lino',
                    slug: 'camiseta-lino',
                    precioBase: '34.90',
                    activo: true,
                    imagenes: [],
                    disenador: { nombreMarca: 'Liñares Moda' },
                },
            },
        },
    ],
};
const direccionSimulada = { id: 'dir-1', usuarioId: 'u-cli-1', alias: 'Casa', linea1: 'Calle Real 1', linea2: null, ciudad: 'A Coruña', codigoPostal: '15001', provincia: 'A Coruña', pais: 'ES', esPrincipal: true };
beforeEach(() => jest.clearAllMocks());
describe('POST /pedidos (checkout)', () => {
    it('401 sin autenticación', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).post('/pedidos').send({});
        expect(r.status).toBe(401);
    });
    it('403 si es DISEÑADOR (no puede hacer checkout)', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/pedidos')
            .set('Authorization', `Bearer ${tokenDisenador}`)
            .send({ direccionEnvioId: 'aaaaaaaa-0000-0000-0000-000000000001', metodoPago: 'TARJETA' });
        expect(r.status).toBe(403);
    });
    it('400 si falta dirección o metodoPago', async () => {
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/pedidos')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ metodoPago: 'TARJETA' }); // falta direccionEnvioId
        expect(r.status).toBe(400);
    });
    it('201 crea pedido desde carrito', async () => {
        carritoMock.buscarDeCliente.mockResolvedValueOnce(carritoConItems);
        dirMock.buscarPorId.mockResolvedValueOnce(direccionSimulada);
        repoMock.crearDesdeCarrito.mockResolvedValueOnce(pedidoSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .post('/pedidos')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ direccionEnvioId: 'aaaaaaaa-0000-0000-0000-000000000001', metodoPago: 'TARJETA' });
        expect(r.status).toBe(201);
        expect(r.body.pedido.numeroPedido).toBe('GW-2026-00001');
        expect(r.body.pedido.estado).toBe('PENDIENTE_PAGO');
    });
});
describe('GET /pedidos', () => {
    it('200 lista pedidos del cliente', async () => {
        repoMock.listarDeCliente.mockResolvedValueOnce([pedidoSimulado]);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/pedidos').set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.pedidos).toHaveLength(1);
    });
    it('200 lista ventas del diseñador', async () => {
        repoMock.listarDeDisenador.mockResolvedValueOnce([pedidoSimulado]);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app).get('/pedidos').set('Authorization', `Bearer ${tokenDisenador}`);
        expect(r.status).toBe(200);
    });
});
describe('GET /pedidos/:id', () => {
    it('200 devuelve detalle del pedido', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado);
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/pedidos/ped-1')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.pedido.numeroPedido).toBe('GW-2026-00001');
    });
    it('403 si el cliente no es propietario', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce({
            ...pedidoSimulado,
            clienteId: 'otro-cliente',
            lineas: [],
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .get('/pedidos/ped-1')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(403);
    });
});
describe('PATCH /pedidos/:id/pagar (stub)', () => {
    it('200 paga el pedido', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado);
        repoMock.marcarComoPagado.mockResolvedValueOnce({
            ...pedidoSimulado,
            estado: client_1.EstadoPedido.PAGADO,
            fechaPago: new Date(),
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/pedidos/ped-1/pagar')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.pedido.estado).toBe('PAGADO');
    });
});
describe('PATCH /pedidos/:id/cancelar', () => {
    it('200 cancela pedido en PENDIENTE_PAGO', async () => {
        repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado);
        repoMock.cancelar.mockResolvedValueOnce({
            ...pedidoSimulado,
            estado: client_1.EstadoPedido.CANCELADO,
        });
        const app = (0, aplicacion_1.crearAplicacion)();
        const r = await (0, supertest_1.default)(app)
            .patch('/pedidos/ped-1/cancelar')
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(r.status).toBe(200);
        expect(r.body.pedido.estado).toBe('CANCELADO');
    });
});
//# sourceMappingURL=pedidos.rutas.test.js.map