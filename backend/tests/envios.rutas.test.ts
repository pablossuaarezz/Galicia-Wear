// Tests de integración HTTP para /pedidos/:pedidoId/envio.
import jwt from 'jsonwebtoken';
import { Rol, EstadoPedido, MetodoPago, Transportista } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
}));

// Los triggers de notificación son fire-and-forget; mockeamos el servicio para no tocar Mongo.
jest.mock('../src/modulos/notificaciones/servicio', () => ({
  servicioNotificaciones: { crear: jest.fn().mockResolvedValue(null) },
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

jest.mock('../src/modulos/envios/repositorio', () => ({
  repositorioEnvios: {
    buscarPorId: jest.fn(),
    buscarDePedido: jest.fn(),
    actualizar: jest.fn(),
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

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioPedidos } from '../src/modulos/pedidos/repositorio';
import { repositorioEnvios } from '../src/modulos/envios/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoPedidosMock = repositorioPedidos as jest.Mocked<typeof repositorioPedidos>;
const repoEnviosMock = repositorioEnvios as jest.Mocked<typeof repositorioEnvios>;

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

const pedidoAceptado = {
  id: 'ped-1',
  numeroPedido: 'GW-2026-00001',
  clienteId: 'u-cli-1',
  estado: EstadoPedido.ACEPTADO,
  subtotal: '34.90', costeEnvio: '4.90', total: '39.80',
  metodoPago: MetodoPago.TARJETA,
  fechaCreacion: new Date(), fechaPago: new Date(), fechaAceptacion: new Date(),
  notas: null,
  direccionEnvio: { alias: 'Casa', linea1: 'Calle Real 1', linea2: null, ciudad: 'A Coruña', codigoPostal: '15001', provincia: 'A Coruña', pais: 'ES' },
  lineas: [{ id: 'lin-1', cantidad: 1, precioUnitario: '34.90', estadoLinea: EstadoPedido.ACEPTADO, disenadorId: 'u-dis-1', variante: { talla: 'M', color: 'Natural', sku: 'CLI-M', producto: { nombre: 'Camiseta', slug: 'camiseta' } }, disenador: { nombreMarca: 'Liñares Moda' } }],
  envio: { id: 'env-1', transportista: Transportista.CORREOS_VERDE, envioEcologico: true, numeroSeguimiento: null, entregaEstimada: null, fechaEnvio: null, fechaEntrega: null },
};

const envioSimulado = {
  id: 'env-1',
  pedidoId: 'ped-1',
  transportista: Transportista.CORREOS_VERDE,
  envioEcologico: true,
  numeroSeguimiento: null,
  entregaEstimada: null,
  fechaEnvio: null,
  fechaEntrega: null,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /pedidos/:pedidoId/envio', () => {
  it('401 sin autenticación', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/pedidos/ped-1/envio');
    expect(r.status).toBe(401);
  });

  it('200 cliente ve el envío de su pedido', async () => {
    repoPedidosMock.buscarPorId.mockResolvedValueOnce(pedidoAceptado as never);
    repoEnviosMock.buscarDePedido.mockResolvedValueOnce(envioSimulado as never);
    const app = crearAplicacion();
    const r = await request(app)
      .get('/pedidos/ped-1/envio')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.envio.transportista).toBe('CORREOS_VERDE');
    expect(r.body.envio.envioEcologico).toBe(true);
  });
});

describe('PATCH /pedidos/:pedidoId/envio', () => {
  it('403 si no es DISEÑADOR', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/pedidos/ped-1/envio')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ numeroSeguimiento: 'ES123456789ES' });
    expect(r.status).toBe(403);
  });

  it('200 actualiza el número de seguimiento', async () => {
    repoPedidosMock.buscarPorId.mockResolvedValueOnce(pedidoAceptado as never);
    repoEnviosMock.buscarDePedido.mockResolvedValueOnce(envioSimulado as never);
    repoEnviosMock.actualizar.mockResolvedValueOnce({
      ...envioSimulado,
      numeroSeguimiento: 'ES123456789ES',
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/pedidos/ped-1/envio')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ numeroSeguimiento: 'ES123456789ES' });
    expect(r.status).toBe(200);
    expect(r.body.envio.numeroSeguimiento).toBe('ES123456789ES');
  });

  it('200 marca como enviado (avanza estado)', async () => {
    repoPedidosMock.buscarPorId.mockResolvedValueOnce(pedidoAceptado as never);
    repoEnviosMock.buscarDePedido.mockResolvedValueOnce(envioSimulado as never);
    repoEnviosMock.actualizar.mockResolvedValueOnce({
      ...envioSimulado,
      fechaEnvio: new Date(),
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/pedidos/ped-1/envio')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ marcarComoEnviado: true });
    expect(r.status).toBe(200);
    expect(r.body.envio.fechaEnvio).toBeDefined();
  });
});
