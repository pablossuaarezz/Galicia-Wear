// Tests de integración HTTP para /productos/:productoId/variantes.
import jwt from 'jsonwebtoken';
import { Rol, MaterialPrincipal, CiudadGallega, TallaPrenda } from '@prisma/client';

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
import { repositorioVariantes } from '../src/modulos/variantes/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoProductosMock = repositorioProductos as jest.Mocked<typeof repositorioProductos>;
const repoVariantesMock = repositorioVariantes as jest.Mocked<typeof repositorioVariantes>;

const tokenDisenador = jwt.sign(
  { sub: 'u-dis-1', correo: 'dis@test.gal', rol: Rol.DISENADOR },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const productoSimulado = {
  id: 'prod-1',
  disenadorId: 'u-dis-1',
  nombre: 'Camiseta Lino',
  slug: 'camiseta-lino',
  activo: true,
  disenador: { nombreMarca: 'Liñares Moda', ciudad: CiudadGallega.CORUNA, urlLogo: null, urlWeb: null },
  variantes: [], imagenes: [], certificados: [],
  descripcion: 'desc', precioBase: '29.99', kmOrigen: 15,
  materialPrincipal: MaterialPrincipal.LINO, fechaCreacion: new Date(), fechaActualizacion: new Date(),
};

const varianteSimulada = {
  id: 'var-1',
  productoId: 'prod-1',
  talla: TallaPrenda.M,
  color: 'Blanco Natural',
  sku: 'CAM-LINO-M-BLN',
  stock: 10,
  ajustePrecio: '0',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /productos/:productoId/variantes', () => {
  it('200 lista variantes sin autenticación', async () => {
    repoVariantesMock.listarDeProducto.mockResolvedValueOnce([varianteSimulada] as never);
    const app = crearAplicacion();
    const r = await request(app).get('/productos/prod-1/variantes');
    expect(r.status).toBe(200);
    expect(r.body.variantes[0].sku).toBe('CAM-LINO-M-BLN');
  });
});

describe('POST /productos/:productoId/variantes', () => {
  it('401 sin token', async () => {
    const app = crearAplicacion();
    const r = await request(app).post('/productos/prod-1/variantes').send({});
    expect(r.status).toBe(401);
  });

  it('400 si falta la talla', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos/prod-1/variantes')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ color: 'Blanco', sku: 'CAM-M-BLN' }); // falta talla
    expect(r.status).toBe(400);
  });

  it('201 crea variante correctamente', async () => {
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoVariantesMock.crear.mockResolvedValueOnce(varianteSimulada as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos/prod-1/variantes')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ talla: TallaPrenda.M, color: 'Blanco Natural', sku: 'CAM-LINO-M-BLN', stock: 10 });
    expect(r.status).toBe(201);
    expect(r.body.variante.talla).toBe('M');
  });

  it('403 si no es el propietario del producto', async () => {
    repoProductosMock.buscarPorId.mockResolvedValueOnce({
      ...productoSimulado,
      disenadorId: 'otro-disenador',
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/productos/prod-1/variantes')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ talla: TallaPrenda.M, color: 'Rojo', sku: 'CAM-M-R', stock: 5 });
    expect(r.status).toBe(403);
  });
});

describe('PATCH /productos/:productoId/variantes/:id', () => {
  it('200 actualiza el stock de la variante', async () => {
    repoVariantesMock.buscarPorId.mockResolvedValueOnce(varianteSimulada as never);
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoVariantesMock.actualizar.mockResolvedValueOnce({ ...varianteSimulada, stock: 20 } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/productos/prod-1/variantes/var-1')
      .set('Authorization', `Bearer ${tokenDisenador}`)
      .send({ stock: 20 });
    expect(r.status).toBe(200);
    expect(r.body.variante.stock).toBe(20);
  });
});

describe('DELETE /productos/:productoId/variantes/:id', () => {
  it('204 elimina variante', async () => {
    repoVariantesMock.buscarPorId.mockResolvedValueOnce(varianteSimulada as never);
    repoProductosMock.buscarPorId.mockResolvedValueOnce(productoSimulado as never);
    repoVariantesMock.eliminar.mockResolvedValueOnce(undefined);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/productos/prod-1/variantes/var-1')
      .set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(204);
  });
});
