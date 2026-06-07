// Tests de integración del gateway Socket.IO de chat: handshake con JWT, entrega
// en tiempo real entre cliente y tienda, e historial al unirse a la sala.
import http from 'http';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { io as Cliente, type Socket as SocketCliente } from 'socket.io-client';

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

import { crearAplicacion } from '../src/aplicacion';
import { inicializarSockets } from '../src/tiempoReal/servidorSockets';
import { repositorioChat } from '../src/modulos/chat/repositorio';
import { entorno } from '../src/configuracion/entorno';

const repoMock = repositorioChat as jest.Mocked<typeof repositorioChat>;

// Ids reales con formato UUID: el DTO de envío valida `disenadorId` como uuid (los ids
// de Usuario en BD lo son), así que el test debe usar uuids válidos.
const ID_CLIENTE = '11111111-1111-1111-1111-111111111111';
const ID_DISENADOR = '22222222-2222-2222-2222-222222222222';

const perfiles: Record<string, unknown> = {
  [ID_CLIENTE]: { id: ID_CLIENTE, rol: Rol.CLIENTE, cliente: { nombre: 'Ana', apellidos: 'García' }, disenador: null },
  [ID_DISENADOR]: { id: ID_DISENADOR, rol: Rol.DISENADOR, cliente: null, disenador: { nombreMarca: 'Liñares Moda' } },
};

const tokenCliente = jwt.sign({ sub: ID_CLIENTE, correo: 'ana@test.gal', rol: Rol.CLIENTE }, entorno.JWT_SECRET, { expiresIn: '1h' });
const tokenDisenador = jwt.sign({ sub: ID_DISENADOR, correo: 'dis@test.gal', rol: Rol.DISENADOR }, entorno.JWT_SECRET, { expiresIn: '1h' });

let servidor: http.Server;
let io: ReturnType<typeof inicializarSockets>;
let url: string;

beforeAll((done) => {
  repoMock.perfilUsuario.mockImplementation(async (id: string) => (perfiles[id] ?? null) as never);
  repoMock.historialEntre.mockResolvedValue([] as never);
  repoMock.marcarLeidos.mockResolvedValue(0 as never);
  repoMock.crear.mockImplementation(async (remitenteId: string, destinatarioId: string, cuerpo: string) => ({
    id: `m-${Math.random().toString(36).slice(2)}`,
    remitenteId, destinatarioId, cuerpo,
    productoId: null, fechaEnvio: new Date(), fechaLectura: null,
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

it('rechaza la conexión con token inválido', (done) => {
  const s = conectar('token-invalido');
  s.on('connect_error', (err: Error) => {
    expect(err.message).toMatch(/token/i);
    s.close();
    done();
  });
});

it('entrega un mensaje en tiempo real del cliente a la tienda', (done) => {
  const sCliente = conectar(tokenCliente);
  const sDis = conectar(tokenDisenador);
  let conectados = 0;

  const alConectar = (): void => {
    conectados += 1;
    if (conectados < 2) return;

    sDis.emit('unirse_sala', ID_CLIENTE);
    sCliente.emit('unirse_sala', ID_DISENADOR);

    sDis.on('nuevo_mensaje', (msg: { contenido: string; remitenteId: string; remitenteNombre: string }) => {
      try {
        expect(msg.contenido).toBe('Hola, necesito ayuda');
        expect(msg.remitenteId).toBe(ID_CLIENTE);
        expect(msg.remitenteNombre).toBe('Ana García');
        sCliente.close();
        sDis.close();
        done();
      } catch (e) {
        done(e as Error);
      }
    });

    setTimeout(
      () => sCliente.emit('enviar_mensaje', { disenadorId: ID_DISENADOR, contenido: 'Hola, necesito ayuda' }),
      100,
    );
  };

  sCliente.on('connect', alConectar);
  sDis.on('connect', alConectar);
});

it('envía el historial al unirse a la sala', (done) => {
  repoMock.historialEntre.mockResolvedValueOnce([
    { id: 'm1', remitenteId: ID_DISENADOR, destinatarioId: ID_CLIENTE, cuerpo: 'Hola de nuevo', productoId: null, fechaEnvio: new Date(), fechaLectura: null },
  ] as never);

  const sCliente = conectar(tokenCliente);
  sCliente.on('connect', () => sCliente.emit('unirse_sala', ID_DISENADOR));
  sCliente.on('mensaje_historial', (lista: Array<{ contenido: string }>) => {
    try {
      expect(Array.isArray(lista)).toBe(true);
      expect(lista[0].contenido).toBe('Hola de nuevo');
      sCliente.close();
      done();
    } catch (e) {
      done(e as Error);
    }
  });
});
