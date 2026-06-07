// Tests de integración HTTP para /chat (bandeja de conversaciones e historial REST).
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({ prisma: {} as unknown, cerrarConexionBd: jest.fn() }));

jest.mock('../src/modulos/chat/repositorio', () => ({
  repositorioChat: {
    perfilUsuario: jest.fn(),
    conversacionesDe: jest.fn(),
    historialEntre: jest.fn(),
    marcarLeidos: jest.fn(),
    crear: jest.fn(),
    buscarPorId: jest.fn(),
  },
}));

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { repositorioChat } from '../src/modulos/chat/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioChat as jest.Mocked<typeof repositorioChat>;

const tokenCliente = jwt.sign(
  { sub: 'u-cli-1', correo: 'ana@test.gal', rol: Rol.CLIENTE },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const perfilCliente = {
  id: 'u-cli-1', rol: Rol.CLIENTE,
  cliente: { nombre: 'Ana', apellidos: 'García' }, disenador: null,
};
const perfilDisenador = {
  id: 'u-dis-1', rol: Rol.DISENADOR,
  cliente: null, disenador: { nombreMarca: 'Liñares Moda' },
};

beforeEach(() => jest.clearAllMocks());

describe('GET /chat/conversaciones', () => {
  it('401 sin token', async () => {
    const app = crearAplicacion();
    const r = await request(app).get('/chat/conversaciones');
    expect(r.status).toBe(401);
  });

  it('200 devuelve las conversaciones con nombre del peer y no leídos', async () => {
    repoMock.conversacionesDe.mockResolvedValueOnce([
      { peerId: 'u-dis-1', ultimoMensaje: 'Hola', fechaUltimo: new Date('2026-06-07T10:00:00Z'), noLeidos: 2 },
    ] as never);
    repoMock.perfilUsuario.mockResolvedValueOnce(perfilDisenador as never);

    const app = crearAplicacion();
    const r = await request(app)
      .get('/chat/conversaciones')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(r.status).toBe(200);
    expect(r.body.conversaciones).toHaveLength(1);
    expect(r.body.conversaciones[0].nombre).toBe('Liñares Moda');
    expect(r.body.conversaciones[0].noLeidos).toBe(2);
  });
});

describe('PATCH /chat/:peerId/leer', () => {
  it('204 marca como leídos los mensajes del peer', async () => {
    repoMock.marcarLeidos.mockResolvedValueOnce(3 as never);
    const app = crearAplicacion();
    const r = await request(app)
      .patch('/chat/u-dis-1/leer')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(r.status).toBe(204);
    expect(repoMock.marcarLeidos).toHaveBeenCalledWith('u-cli-1', 'u-dis-1');
  });
});

describe('GET /chat/:peerId/mensajes', () => {
  it('200 devuelve el historial con contenido y nombre del remitente', async () => {
    repoMock.perfilUsuario
      .mockResolvedValueOnce(perfilCliente as never) // usuarioId
      .mockResolvedValueOnce(perfilDisenador as never); // peerId
    repoMock.historialEntre.mockResolvedValueOnce([
      { id: 'm1', remitenteId: 'u-cli-1', destinatarioId: 'u-dis-1', cuerpo: 'Hola', productoId: null, fechaEnvio: new Date(), fechaLectura: null },
    ] as never);

    const app = crearAplicacion();
    const r = await request(app)
      .get('/chat/u-dis-1/mensajes')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(r.status).toBe(200);
    expect(r.body.mensajes[0].contenido).toBe('Hola');
    expect(r.body.mensajes[0].remitenteNombre).toBe('Ana García');
  });
});
