// Tests de integración HTTP para /direcciones. Repositorio mockeado → sin BBDD real.
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({
  prisma: {} as unknown,
  cerrarConexionBd: jest.fn(),
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
import { repositorioDirecciones } from '../src/modulos/direcciones/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioDirecciones as jest.Mocked<typeof repositorioDirecciones>;

const tokenCliente = jwt.sign(
  { sub: 'u-cliente-1', correo: 'ana@test.gal', rol: Rol.CLIENTE },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const direccionSimulada = {
  id: 'dir-1',
  usuarioId: 'u-cliente-1',
  alias: 'Casa',
  linea1: 'Calle Real 15',
  linea2: null,
  ciudad: 'A Coruña',
  codigoPostal: '15001',
  provincia: 'A Coruña',
  pais: 'ES',
  esPrincipal: false,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /direcciones', () => {
  it('401 sin autenticación', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/direcciones');
    expect(r.status).toBe(401);
  });

  it('200 devuelve lista de direcciones del usuario', async () => {
    repoMock.listarDeUsuario.mockResolvedValueOnce([direccionSimulada] as never);
    const app = crearAplicacion();
    const r = await request(app)
      .get('/direcciones')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.direcciones)).toBe(true);
    expect(r.body.direcciones[0].alias).toBe('Casa');
  });
});

describe('POST /direcciones', () => {
  it('400 si falta codigoPostal o tiene formato incorrecto', async () => {
    const app = crearAplicacion();
    const r = await request(app)
      .post('/direcciones')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ alias: 'Casa', linea1: 'Calle Real 15', ciudad: 'A Coruña', codigoPostal: '123' });
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe('ERROR_VALIDACION');
  });

  it('201 crea dirección con datos válidos', async () => {
    repoMock.crear.mockResolvedValueOnce(direccionSimulada as never);
    const app = crearAplicacion();
    const r = await request(app)
      .post('/direcciones')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        alias: 'Casa',
        linea1: 'Calle Real 15',
        ciudad: 'A Coruña',
        codigoPostal: '15001',
      });
    expect(r.status).toBe(201);
    expect(r.body.direccion.alias).toBe('Casa');
  });
});

describe('DELETE /direcciones/:id', () => {
  it('204 elimina dirección propia', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(direccionSimulada as never);
    repoMock.eliminar.mockResolvedValueOnce(undefined);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/direcciones/dir-1')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(204);
  });

  it('403 si la dirección pertenece a otro usuario', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce({
      ...direccionSimulada,
      usuarioId: 'otro-usuario',
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .delete('/direcciones/dir-1')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(403);
  });
});

describe('PATCH /direcciones/:id/principal', () => {
  it('200 marca la dirección como principal', async () => {
    repoMock.buscarPorId.mockResolvedValueOnce(direccionSimulada as never);
    repoMock.marcarPrincipal.mockResolvedValueOnce({
      ...direccionSimulada,
      esPrincipal: true,
    } as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/direcciones/dir-1/principal')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.direccion.esPrincipal).toBe(true);
  });
});
