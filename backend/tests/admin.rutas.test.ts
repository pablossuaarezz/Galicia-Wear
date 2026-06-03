// Tests de integración HTTP para /admin.
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
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

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import {
  obtenerEstadisticas,
  listarLogs,
  listarPedidosAdmin,
  listarDisenadoresAdmin,
  listarProductosAdmin,
  moderarProducto,
  retirarProducto,
} from '../src/modulos/admin/repositorio';
import { exportarProductos } from '../src/modulos/admin/exportacion';
import { importarProductos } from '../src/modulos/admin/importacion';
import { entorno } from '../src/configuracion/entorno';

const estadMock = obtenerEstadisticas as jest.Mock;
const exportMock = exportarProductos as jest.Mock;
const importMock = importarProductos as jest.Mock;
const logsMock = listarLogs as jest.Mock;
const pedidosMock = listarPedidosAdmin as jest.Mock;
const disenadoresMock = listarDisenadoresAdmin as jest.Mock;
const productosMock = listarProductosAdmin as jest.Mock;
const moderarMock = moderarProducto as jest.Mock;
const retirarMock = retirarProducto as jest.Mock;

const tokenAdmin = jwt.sign(
  { sub: 'u-admin-1', correo: 'admin@test.gal', rol: Rol.ADMIN },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const tokenCliente = jwt.sign(
  { sub: 'u-cli-1', correo: 'ana@test.gal', rol: Rol.CLIENTE },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

beforeEach(() => jest.clearAllMocks());

describe('GET /admin/estadisticas', () => {
  it('401 sin autenticación', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/admin/estadisticas');
    expect(r.status).toBe(401);
  });

  it('403 si no es ADMIN', async () => {
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
      .get('/admin/exportar/productos.xml')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/xml/);
    expect(exportMock).toHaveBeenCalledWith('xml');
  });
});

describe('POST /admin/importar/productos', () => {
  it('403 si no es admin', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/admin/importar/productos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .set('Content-Type', 'application/json')
      .send('[]');
    expect(r.status).toBe(403);
  });

  it('200 importa productos desde JSON', async () => {
    importMock.mockResolvedValueOnce({ creados: 2, actualizados: 0, errores: [] });
    const app = crearAplicacion();
    const r = await request(app)
      .post('/admin/importar/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ formato: 'json', datos: JSON.stringify([]) });
    expect(r.status).toBe(200);
    expect(r.body.resultado.creados).toBe(2);
    expect(importMock).toHaveBeenCalledWith(expect.any(String), 'json');
  });

  it('200 importa productos desde XML', async () => {
    importMock.mockResolvedValueOnce({ creados: 1, actualizados: 1, errores: [] });
    const app = crearAplicacion();
    const r = await request(app)
      .post('/admin/importar/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ formato: 'xml', datos: '<galiciawear_export><productos/></galiciawear_export>' });
    expect(r.status).toBe(200);
    expect(importMock).toHaveBeenCalledWith(expect.any(String), 'xml');
  });
});

describe('GET /admin/logs', () => {
  it('403 si no es admin', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .get('/admin/logs')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(403);
  });

  it('200 devuelve logs paginados al admin', async () => {
    logsMock.mockResolvedValueOnce({
      datos: [{ accion: 'LOGIN', recurso: 'usuario', fechaCreacion: new Date().toISOString() }],
      total: 1,
    });
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
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
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/admin/productos/pr1')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(r.status).toBe(204);
    expect(retirarMock).toHaveBeenCalledWith('pr1');
  });
});
