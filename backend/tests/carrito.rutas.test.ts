// Tests de integración HTTP para /carrito.
import jwt from 'jsonwebtoken';
import { Rol, TallaPrenda, CiudadGallega } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
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

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioCarrito } from '../src/modulos/carrito/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioCarrito as jest.Mocked<typeof repositorioCarrito>;

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

const carritoSimulado = {
  id: 'cart-1',
  clienteId: 'u-cli-1',
  fechaActualizacion: new Date(),
  items: [
    {
      id: 'item-1',
      cantidad: 2,
      fechaAnadido: new Date(),
      variante: {
        id: 'var-1',
        talla: TallaPrenda.M,
        color: 'Natural Crudo',
        sku: 'CLI-LINO-M-NC',
        stock: 10,
        ajustePrecio: '0',
        producto: {
          id: 'prod-1',
          disenadorId: 'u-dis-1',
          nombre: 'Camiseta Lino Gallego',
          slug: 'camiseta-lino-gallego-seed',
          precioBase: '34.90',
          activo: true,
          imagenes: [{ url: 'https://cdn.example.com/img.jpg', textoAlternativo: null }],
          disenador: { nombreMarca: 'Liñares Moda' },
        },
      },
    },
  ],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /carrito', () => {
  it('401 sin autenticación', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/carrito');
    expect(r.status).toBe(401);
  });

  it('403 si es DISEÑADOR (no tienen carrito)', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/carrito').set('Authorization', `Bearer ${tokenDisenador}`);
    expect(r.status).toBe(403);
  });

  it('200 devuelve carrito con ítems', async () => {
    repoMock.obtenerOCrear.mockResolvedValueOnce(carritoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app).get('/carrito').set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.carrito.items).toHaveLength(1);
    expect(r.body.carrito.items[0].variante.sku).toBe('CLI-LINO-M-NC');
  });
});

describe('POST /carrito/items', () => {
  it('400 con cantidad inválida', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/carrito/items')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ varianteId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', cantidad: 0 });
    expect(r.status).toBe(400);
  });

  it('400 sin UUID válido de variante', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/carrito/items')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ varianteId: 'no-es-uuid', cantidad: 1 });
    expect(r.status).toBe(400);
  });

  it('200 añade artículo al carrito', async () => {
    repoMock.agregarOActualizarItem.mockResolvedValueOnce(carritoSimulado as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/carrito/items')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ varianteId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', cantidad: 2 });
    expect(r.status).toBe(200);
    expect(r.body.carrito.items).toHaveLength(1);
  });
});

describe('DELETE /carrito/items/:varianteId', () => {
  it('200 elimina el artículo', async () => {
    repoMock.buscarDeCliente.mockResolvedValueOnce(carritoSimulado as never);
    repoMock.eliminarItem.mockResolvedValueOnce({ ...carritoSimulado, items: [] } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/carrito/items/var-1')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.carrito.items).toHaveLength(0);
  });
});

describe('DELETE /carrito', () => {
  it('204 vacía el carrito', async () => {
    repoMock.vaciar.mockResolvedValueOnce(undefined);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/carrito')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(204);
  });
});
