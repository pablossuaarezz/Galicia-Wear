// Tests de integración HTTP para /productos/:productoId/imagenes.
import jwt from 'jsonwebtoken';
import { Rol, MaterialPrincipal, CiudadGallega } from '@prisma/client';

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
import { repositorioImagenes } from '../src/modulos/imagenes/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoProductosMock = repositorioProductos as jest.Mocked<typeof repositorioProductos>;
const repoImagenesMock = repositorioImagenes as jest.Mocked<typeof repositorioImagenes>;

const tokenDisenador = jwt.sign(
  { sub: 'u-dis-1', correo: 'dis@test.gal', rol: Rol.DISENADOR },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const productoSimulado = {
  id: 'prod-1', disenadorId: 'u-dis-1', nombre: 'Camiseta', slug: 'camiseta', activo: true,
  disenador: { nombreMarca: 'Liñares Moda', ciudad: CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
  variantes: [], imagenes: [], certificados: [],
  descripcion: 'desc', precioBase: '29.99', kmOrigen: 15,
  materialPrincipal: MaterialPrincipal.LINO, fechaCreacion: new Date(), fechaActualizacion: new Date(),
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
    repoImagenesMock.listarDeProducto.mockResolvedValueOnce([imagenSimulada] as never);
    const app = crearAplicacion();
    const r = await request(app).get('/productos/prod-1/imagenes');
    expect(r.status).toBe(200);
    expect(r.body.imagenes[0].esPrincipal).toBe(true);
  });
});

describe('POST /productos/:productoId/imagenes', () => {
  it('401 sin token', async () => {
    const app = crearAplicacion();
    const r = await request(app).post('/productos/prod-1/imagenes').send({});
    expect(r.status).toBe(401);
  });

  it('400 si la URL no es válida', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos/prod-1/imagenes')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ url: 'no-es-una-url' });
    expect(r.status).toBe(400);
  });

  it('201 añade imagen con URL válida', async () => {
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoImagenesMock.crear.mockResolvedValueOnce(imagenSimulada as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos/prod-1/imagenes')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ url: 'https://cdn.galiciawear.gal/camiseta-lino.jpg', esPrincipal: true });
    expect(r.status).toBe(201);
    expect(r.body.imagen.esPrincipal).toBe(true);
  });
});

describe('PATCH /productos/:productoId/imagenes/:id/principal', () => {
  it('200 marca imagen como principal', async () => {
    repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada as never);
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoImagenesMock.marcarPrincipal.mockResolvedValueOnce({ ...imagenSimulada, esPrincipal: true } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/productos/prod-1/imagenes/img-1/principal')
      .set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(200);
    expect(r.body.imagen.esPrincipal).toBe(true);
  });
});

describe('DELETE /productos/:productoId/imagenes/:id', () => {
  it('204 elimina imagen', async () => {
    repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada as never);
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoImagenesMock.eliminar.mockResolvedValueOnce(undefined);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/productos/prod-1/imagenes/img-1')
      .set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(204);
  });

  it('403 si no es el propietario', async () => {
    repoImagenesMock.buscarPorId.mockResolvedValueOnce(imagenSimulada as never);
    repoProductosMock.buscarPorId.mockResolvedValueOnce({
      ...productoSimulado,
      disenadorId: 'otro-disenador',
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/productos/prod-1/imagenes/img-1')
      .set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(403);
  });
});
