// Tests del módulo de notificaciones: el helper `servicioNotificaciones.crear`
// (persiste + emite por socket, degrada si Mongo falla) y los endpoints REST protegidos
// con verificarJwt. El repositorio Mongo y FCM se mockean (no se toca Mongo real).
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

jest.mock('../src/utilidades/prisma', () => ({ prisma: {} as unknown, cerrarConexionBd: jest.fn() }));

jest.mock('../src/modulos/notificaciones/repositorio', () => ({
  repositorioNotificaciones: {
    crear: jest.fn(),
    listarDe: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    guardarFcmMessageId: jest.fn(),
  },
}));

// FCM best-effort mockeado: el push no debe ejecutarse en tests.
jest.mock('../src/modulos/notificaciones/fcm', () => ({
  enviarPush: jest.fn().mockResolvedValue(undefined),
}));

// Socket mockeado para el test del servicio (se inyecta un io falso por test).
jest.mock('../src/tiempoReal/servidorSockets', () => ({ obtenerIo: jest.fn() }));

import request from 'supertest';
import { crearAplicacion } from '../src/aplicacion';
import { servicioNotificaciones } from '../src/modulos/notificaciones/servicio';
import { repositorioNotificaciones } from '../src/modulos/notificaciones/repositorio';
import { obtenerIo } from '../src/tiempoReal/servidorSockets';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioNotificaciones as jest.Mocked<typeof repositorioNotificaciones>;
const obtenerIoMock = obtenerIo as jest.Mock;

const ID_USUARIO = 'u-1';
const token = jwt.sign(
  { sub: ID_USUARIO, correo: 'ana@test.gal', rol: Rol.CLIENTE },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

const docFalso = {
  _id: 'n1',
  tipo: 'PEDIDO_CREADO',
  titulo: 'Nuevo pedido',
  cuerpo: 'Has recibido el pedido GW-2026-00001',
  datos: { pedidoId: 'p1' },
  leida: false,
  fechaCreacion: new Date('2026-06-07T10:00:00Z'),
};

beforeEach(() => jest.clearAllMocks());

describe('servicioNotificaciones.crear', () => {
  it('persiste y emite "nueva_notificacion" a la sala personal usuario:<id>', async () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    obtenerIoMock.mockReturnValue({ to });
    repoMock.crear.mockResolvedValueOnce(docFalso as never);

    const dto = await servicioNotificaciones.crear({
      destinatarioId: ID_USUARIO,
      tipo: 'PEDIDO_CREADO',
      titulo: 'Nuevo pedido',
      cuerpo: 'Has recibido el pedido GW-2026-00001',
      datos: { pedidoId: 'p1' },
    });

    expect(repoMock.crear).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith(`usuario:${ID_USUARIO}`);
    expect(emit).toHaveBeenCalledWith(
      'nueva_notificacion',
      expect.objectContaining({ id: 'n1', tipo: 'PEDIDO_CREADO', datos: { pedidoId: 'p1' } }),
    );
    expect(dto?.id).toBe('n1');
    expect(dto?.leida).toBe(false);
  });

  it('degrada con elegancia si Mongo falla (devuelve null, no lanza)', async () => {
    obtenerIoMock.mockReturnValue(null);
    repoMock.crear.mockRejectedValueOnce(new Error('mongo down'));

    const dto = await servicioNotificaciones.crear({
      destinatarioId: ID_USUARIO,
      tipo: 'MENSAJE_NUEVO',
      titulo: 'Ana',
      cuerpo: 'Hola',
    });

    expect(dto).toBeNull();
  });
});

describe('GET /notificaciones', () => {
  it('401 sin token', async () => {
    const r = await request(crearAplicacion()).get('/notificaciones');
    expect(r.status).toBe(401);
  });

  it('200 devuelve { notificaciones, total }', async () => {
    repoMock.listarDe.mockResolvedValueOnce({ datos: [docFalso], total: 1 } as never);
    const r = await request(crearAplicacion())
      .get('/notificaciones')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body.total).toBe(1);
    expect(r.body.notificaciones[0].id).toBe('n1');
    expect(r.body.notificaciones[0].tipo).toBe('PEDIDO_CREADO');
    expect(repoMock.listarDe).toHaveBeenCalledWith(ID_USUARIO, { pagina: 1, limite: 20 });
  });
});

describe('GET /notificaciones/contador', () => {
  it('200 devuelve { noLeidas }', async () => {
    repoMock.contarNoLeidas.mockResolvedValueOnce(3 as never);
    const r = await request(crearAplicacion())
      .get('/notificaciones/contador')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body.noLeidas).toBe(3);
    expect(repoMock.contarNoLeidas).toHaveBeenCalledWith(ID_USUARIO);
  });
});

describe('PATCH /notificaciones/:id/leer', () => {
  it('204 marca una notificación como leída (acotada al usuario)', async () => {
    repoMock.marcarLeida.mockResolvedValueOnce(true as never);
    const r = await request(crearAplicacion())
      .patch('/notificaciones/n1/leer')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(204);
    expect(repoMock.marcarLeida).toHaveBeenCalledWith('n1', ID_USUARIO);
  });
});

describe('PATCH /notificaciones/leer-todas', () => {
  it('200 devuelve { actualizadas }', async () => {
    repoMock.marcarTodasLeidas.mockResolvedValueOnce(5 as never);
    const r = await request(crearAplicacion())
      .patch('/notificaciones/leer-todas')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body.actualizadas).toBe(5);
    expect(repoMock.marcarTodasLeidas).toHaveBeenCalledWith(ID_USUARIO);
  });
});
