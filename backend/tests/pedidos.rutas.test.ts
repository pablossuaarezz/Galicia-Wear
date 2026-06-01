// Tests de integración HTTP para /pedidos.
import jwt from 'jsonwebtoken';
import { Rol, EstadoPedido, MetodoPago, Transportista } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
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

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioPedidos } from '../src/modulos/pedidos/repositorio';
import { repositorioCarrito } from '../src/modulos/carrito/repositorio';
import { repositorioDirecciones } from '../src/modulos/direcciones/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioPedidos as jest.Mocked<typeof repositorioPedidos>;
const carritoMock = repositorioCarrito as jest.Mocked<typeof repositorioCarrito>;
const dirMock = repositorioDirecciones as jest.Mocked<typeof repositorioDirecciones>;

const tokenCliente = jwt.sign(
  { sub: 'u-cli-1', correo: 'ana@test.gal', rol: Rol.CLIENTE },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);
const tokenDisenador = jwt.sign(
  { sub: 'u-dis-1', correo: 'dis@test.gal', rol: Rol.DISENADOR },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const pedidoSimulado = {
  id: 'ped-1',
  numeroPedido: 'GW-2026-00001',
  clienteId: 'u-cli-1',
  estado: EstadoPedido.PENDIENTE_PAGO,
  subtotal: '34.90',
  costeEnvio: '4.90',
  total: '39.80',
  metodoPago: MetodoPago.TARJETA,
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
      estadoLinea: EstadoPedido.PENDIENTE_PAGO,
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
    const app = crearAplicacion();
    const r = await request(app).post('/pedidos').send({});
    expect(r.status).toBe(401);
  });

  it('403 si es DISEÑADOR (no puede hacer checkout)', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/pedidos')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ direccionEnvioId: 'aaaaaaaa-0000-0000-0000-000000000001', metodoPago: 'TARJETA' });
    expect(r.status).toBe(403);
  });

  it('400 si falta dirección o metodoPago', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/pedidos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ metodoPago: 'TARJETA' }); // falta direccionEnvioId
    expect(r.status).toBe(400);
  });

  it('201 crea pedido desde carrito', async () => {
    carritoMock.buscarDeCliente.mockResolvedValueOnce(carritoConItems as never);
    dirMock.buscarPorId.mockResolvedValueOnce(direccionSimulada as never);
    repoMock.crearDesdeCarrito.mockResolvedValueOnce(pedidoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app)
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
    repoMock.listarDeCliente.mockResolvedValueOnce([pedidoSimulado] as never);
    const app = crearAplicacion();
    const r = await request(app).get('/pedidos').set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.pedidos).toHaveLength(1);
  });

  it('200 lista ventas del diseñador', async () => {
    repoMock.listarDeDisenador.mockResolvedValueOnce([pedidoSimulado] as never);
    const app = crearAplicacion();
    const r = await request(app).get('/pedidos').set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(200);
  });
});

describe('GET /pedidos/:id', () => {
  it('200 devuelve detalle del pedido', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app)
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
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .get('/pedidos/ped-1')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(403);
  });
});

describe('PATCH /pedidos/:id/pagar (stub)', () => {
  it('200 paga el pedido', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado as never);
    repoMock.marcarComoPagado.mockResolvedValueOnce({
      ...pedidoSimulado,
      estado: EstadoPedido.PAGADO,
      fechaPago: new Date(),
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/pedidos/ped-1/pagar')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.pedido.estado).toBe('PAGADO');
  });
});

describe('PATCH /pedidos/:id/cancelar', () => {
  it('200 cancela pedido en PENDIENTE_PAGO', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(pedidoSimulado as never);
    repoMock.cancelar.mockResolvedValueOnce({
      ...pedidoSimulado,
      estado: EstadoPedido.CANCELADO,
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/pedidos/ped-1/cancelar')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.pedido.estado).toBe('CANCELADO');
  });
});
