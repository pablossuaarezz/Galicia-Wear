// JUSTIFICACIÓN: gateway de tiempo real con Socket.IO para el chat de soporte
// tienda <-> cliente. Vive separado de Express (aplicacion.ts) pero se engancha al mismo
// servidor HTTP en index.ts. Cumple el requisito DAM "Sockets/WebSockets e hilos".
import type { Server as ServidorHttp } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { entorno } from '../configuracion/entorno';
import { registrador } from '../utilidades/registrador';
import type { PayloadJwt } from '../middlewares/autenticacion';
import { servicioChat } from '../modulos/chat/servicio';
import { dtoEnviarMensaje } from '../modulos/chat/dto';

let io: Server | null = null;

// Sala determinista 1:1: el par ordenado de ids garantiza el mismo nombre en ambos
// sentidos (el cliente entra con el id de la tienda; la tienda con el id del cliente).
function salaPar(idA: string, idB: string): string {
  return `sala:${[idA, idB].sort().join('__')}`;
}

export function inicializarSockets(servidor: ServidorHttp): Server {
  io = new Server(servidor, { cors: { origin: '*' } });

  // Autenticación en el handshake: el cliente envía el JWT en `auth.token` (Socket.IO v4).
  // Se verifica con el mismo secreto que el middleware HTTP `verificarJwt`.
  io.use((socket, siguiente) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? undefined;
    if (!token) return siguiente(new Error('Falta token de autenticación'));
    try {
      socket.data.usuario = jwt.verify(token, entorno.JWT_SECRET) as PayloadJwt;
      siguiente();
    } catch {
      siguiente(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const usuario = socket.data.usuario as PayloadJwt;
    registrador.info({ usuario: usuario.sub }, '[socket] conectado');

    // El cliente entra a la sala de la conversación con `peerId` (id del otro usuario).
    socket.on('unirse_sala', async (peerId: unknown) => {
      if (typeof peerId !== 'string' || peerId.length === 0) return;
      const sala = salaPar(usuario.sub, peerId);
      await socket.join(sala);
      try {
        const historial = await servicioChat.historial(usuario.sub, peerId);
        socket.emit('mensaje_historial', historial);
        await servicioChat.marcarLeidos(usuario.sub, peerId);
      } catch (error) {
        registrador.warn({ err: error }, '[socket] error cargando historial');
      }
    });

    // Envío de mensaje: el emisor SIEMPRE se identifica por el JWT, nunca por el payload.
    socket.on('enviar_mensaje', async (datos: unknown) => {
      const parseo = dtoEnviarMensaje.safeParse(datos);
      if (!parseo.success) {
        socket.emit('error_chat', { mensaje: 'Mensaje no válido' });
        return;
      }
      const { disenadorId: peerId, contenido } = parseo.data;
      try {
        const mensaje = await servicioChat.enviar(usuario.sub, peerId, contenido);
        // `io.to(sala)` incluye al emisor: el cliente Android pinta su propio mensaje al
        // recibir el eco (no lo añade localmente al enviar).
        io!.to(salaPar(usuario.sub, peerId)).emit('nuevo_mensaje', mensaje);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'No se pudo enviar el mensaje';
        registrador.warn({ err: error }, '[socket] error enviando mensaje');
        socket.emit('error_chat', { mensaje });
      }
    });

    socket.on('disconnect', () => {
      registrador.info({ usuario: usuario.sub }, '[socket] desconectado');
    });
  });

  registrador.info('[socket] gateway de chat inicializado');
  return io;
}

export function obtenerIo(): Server | null {
  return io;
}
