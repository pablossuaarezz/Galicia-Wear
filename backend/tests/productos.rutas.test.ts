// Tests de integración HTTP para /productos. Repositorios mockeados → sin BBDD real.
import jwt from 'jsonwebtoken';
import { Rol, MaterialPrincipal, CiudadGallega, CodigoCertificado } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
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

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioProductos } from '../src/modulos/productos/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioProductos as jest.Mocked<typeof repositorioProductos>;

const tokenDisenador = jwt.sign(
  { sub: 'u-dis-1', correo: 'dis@test.gal', rol: Rol.DISENADOR },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const productoSimulado = {
  id: 'prod-1',
  disenadorId: 'u-dis-1',
  nombre: 'Camiseta Lino Gallego',
  slug: 'camiseta-lino-gallego-abc123',
  descripcion: 'Camiseta fabricada con lino 100% gallego y procesos sin tintes artificiales.',
  precioBase: '29.99',
  kmOrigen: 15,
  materialPrincipal: MaterialPrincipal.LINO,
  activo: true,
  fechaCreacion: new Date(),
  fechaActualizacion: new Date(),
  disenador: { nombreMarca: 'Liñares Moda', ciudad: CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
  variantes: [],
  imagenes: [],
  certificados: [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /productos', () => {
  it('200 devuelve lista paginada de productos', async () => {
    repoMock.listar.mockResolvedValueOnce({ datos: [productoSimulado] as never, total: 1 });
    const app = crearAplicacion();
    const r = await request(app).get('/productos');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.datos)).toBe(true);
    expect(r.body.total).toBe(1);
    expect(r.body.pagina).toBe(1);
  });

  it('200 con filtros de sostenibilidad', async () => {
    repoMock.listar.mockResolvedValueOnce({ datos: [], total: 0 });
    const app = crearAplicacion();
    const r = await request(app).get('/productos?material=LINO&maxKm=50&ciudad=CORUNA');
    expect(r.status).toBe(200);
  });
});

describe('GET /productos/:slug', () => {
  it('200 devuelve detalle del producto', async () => {
    repoMock.buscarPorSlug.mockResolvedValueOnce(productoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app).get('/productos/camiseta-lino-gallego-abc123');
    expect(r.status).toBe(200);
    expect(r.body.producto.nombre).toBe('Camiseta Lino Gallego');
  });

  it('404 si el producto no existe o está inactivo', async () => {
    repoMock.buscarPorSlug.mockResolvedValueOnce(null);
    const app = crearAplicacion();
    const r = await request(app).get('/productos/slug-inexistente');
    expect(r.status).toBe(404);
  });
});

describe('POST /productos', () => {
  it('401 sin autenticación', async () => {
    const app = crearAplicacion();
    const r = await request(app).post('/productos').send({});
    expect(r.status).toBe(401);
  });

  it('400 si faltan campos obligatorios', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ nombre: 'AB' }); // nombre muy corto, falta descripción, precioBase, material
    expect(r.status).toBe(400);
  });

  it('201 crea producto con datos válidos', async () => {
    repoMock.crear.mockResolvedValueOnce(productoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({
        nombre: 'Camiseta Lino Gallego',
        descripcion: 'Camiseta fabricada con lino 100% gallego y procesos sin tintes artificiales.',
        precioBase: 29.99,
        materialPrincipal: MaterialPrincipal.LINO,
        kmOrigen: 15,
      });
    expect(r.status).toBe(201);
    expect(r.body.producto.slug).toContain('camiseta');
  });
});

describe('PATCH /productos/:id', () => {
  it('200 actualiza precio correctamente', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoMock.actualizar.mockResolvedValueOnce({ ...productoSimulado, precioBase: '34.99' } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/productos/prod-1')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ precioBase: 34.99 });
    expect(r.status).toBe(200);
  });

  it('403 si no es el propietario', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce({
      ...productoSimulado,
      disenadorId: 'otro-disenador',
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/productos/prod-1')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ precioBase: 34.99 });
    expect(r.status).toBe(403);
  });
});

describe('DELETE /productos/:id', () => {
  it('204 desactiva el producto', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoMock.eliminar.mockResolvedValueOnce(undefined);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/productos/prod-1')
      .set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(204);
  });
});
