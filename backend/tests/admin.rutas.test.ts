// Tests de integración HTTP para /admin.
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
}));

// Mock del repositorio admin (estadísticas)
jest.mock('../src/modulos/admin/repositorio', () => ({
  obtenerEstadisticas: jest.fn(),
  obtenerProductosParaExportar: jest.fn(),
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
import { obtenerEstadisticas } from '../src/modulos/admin/repositorio';
import { exportarProductos } from '../src/modulos/admin/exportacion';
import { importarProductos } from '../src/modulos/admin/importacion';
import { entorno } from '../src/configuracion/entorno';

const estadMock = obtenerEstadisticas as jest.Mock;
const exportMock = exportarProductos as jest.Mock;
const importMock = importarProductos as jest.Mock;

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
