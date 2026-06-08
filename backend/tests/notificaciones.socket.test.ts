// Test de integración del tiempo real de notificaciones: un socket autenticado se une a su
// sala personal `usuario:<sub>` al conectar y recibe `nueva_notificacion` cuando el servicio
// `crear` emite. El repositorio Mongo y FCM se mockean (no se toca Mongo real).
import http from 'http';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { io as Cliente, type Socket as SocketCliente } from 'socket.io-client';

jest.mock('../src/utilidades/prisma', () => ({ prisma: {} as unknown, cerrarConexionBd: jest.fn() }));

// El gateway importa el servicio de chat → su repositorio. Lo mockeamos para no tocar Prisma.
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

jest.mock('../src/modulos/notificaciones/fcm', () => ({
  enviarPush: jest.fn().mockResolvedValue(undefined),
}));

import { crearAplicacion } from '../src/aplicacion';
import { inicializarSockets } from '../src/tiempoReal/servidorSockets';
import { servicioNotificaciones } from '../src/modulos/notificaciones/servicio';
import { repositorioNotificaciones } from '../src/modulos/notificaciones/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioNotificaciones as jest.Mocked<typeof repositorioNotificaciones>;

const ID_USUARIO = '33333333-3333-3333-3333-333333333333';
const tokenUsuario = jwt.sign(
  { sub: ID_USUARIO, correo: 'dis@test.gal', rol: Rol.DISENADOR },
  entorno.JWT_SECRET,
  { expiresIn: '1h' },
);

let servidor: http.Server;
let io: ReturnType<typeof inicializarSockets>;
let url: string;

beforeAll((done) => {
  repoMock.crear.mockImplementation(async (datos: any) => ({
    _id: 'n-socket-1',
    leida: false,
    fechaCreacion: new Date('2026-06-08T09:00:00Z'),
    ...datos,
  }) as never);

  servidor = http.createServer(crearAplicacion());
  io = inicializarSockets(servidor);
  servidor.listen(() => {
    const dir = servidor.address();
    const puerto = typeof dir === 'object' && dir ? dir.port : 0;
    url = `http://localhost:${puerto}`;
    done();
  });
});

afterAll((done) => {
  io.close();
  servidor.close(() => done());
});

function conectar(token: string): SocketCliente {
  return Cliente(url, { auth: { token }, transports: ['websocket'], forceNew: true, reconnection: false });
}

it('entrega "nueva_notificacion" al dispositivo conectado del destinatario', (done) => {
  const s = conectar(tokenUsuario);

  s.on('nueva_notificacion', (notif: { id: string; tipo: string; datos: { pedidoId?: string } }) => {
    try {
      expect(notif.id).toBe('n-socket-1');
      expect(notif.tipo).toBe('PEDIDO_PAGADO');
      expect(notif.datos.pedidoId).toBe('p-9');
      s.close();
      done();
    } catch (e) {
      done(e as Error);
    }
  });

  s.on('connect', () => {
    // Pequeño margen para que el handler de conexión complete socket.join('usuario:<sub>').
    setTimeout(() => {
      void servicioNotificaciones.crear({
        destinatarioId: ID_USUARIO,
        tipo: 'PEDIDO_PAGADO',
        titulo: 'Pedido pagado',
        cuerpo: 'El pedido GW-2026-00009 ha sido pagado',
        datos: { pedidoId: 'p-9' },
      });
    }, 100);
  });
});
