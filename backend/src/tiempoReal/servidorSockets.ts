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

// Referencia global al servidor de Socket.IO, accesible desde otros módulos (p. ej.
// el servicio de notificaciones) a través de `obtenerIo()` una vez inicializado.
let io: Server | null = null;

// Sala determinista 1:1: el par ordenado de ids garantiza el mismo nombre en ambos
// sentidos (el cliente entra con el id de la tienda; la tienda con el id del cliente).
/**
 * Calcula el nombre de la sala de Socket.IO correspondiente a una conversación 1:1
 * entre dos usuarios. Ordenando alfabéticamente los ids antes de unirlos se garantiza
 * que ambos participantes (sea cual sea el orden en que cada uno llama a esta función)
 * obtengan exactamente el mismo nombre de sala.
 * @param idA id de uno de los participantes de la conversación.
 * @param idB id del otro participante.
 * @returns nombre de sala con el formato `sala:<idMenor>__<idMayor>`.
 */
function salaPar(idA: string, idB: string): string {
  return `sala:${[idA, idB].sort().join('__')}`;
}

/**
 * Inicializa el servidor de Socket.IO sobre el servidor HTTP existente y registra
 * todos los manejadores de eventos en tiempo real (chat de soporte tienda-cliente y
 * sala personal de notificaciones).
 *
 * Flujo general:
 * 1. Crea la instancia de `Server` con CORS abierto (`origin: '*'`).
 * 2. Middleware de autenticación en el handshake: valida el JWT enviado por el cliente.
 * 3. En cada conexión:
 *    - Une al socket a su sala personal `usuario:<sub>` (para notificaciones push-like).
 *    - Gestiona el evento `unirse_sala` (entrar a una conversación 1:1 y recibir historial).
 *    - Gestiona el evento `enviar_mensaje` (validar, persistir y reemitir el mensaje).
 *    - Gestiona la desconexión (solo logging).
 *
 * @param servidor servidor HTTP de Node sobre el que se monta Socket.IO (compartido con Express).
 * @returns la instancia de `Server` de Socket.IO ya inicializada.
 */
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

    // Sala personal: el servicio de notificaciones emite `nueva_notificacion` a
    // `usuario:<sub>` y llega a cualquier dispositivo conectado del usuario, sin FCM.
    // (No interfiere con las salas de chat 1:1; un socket puede estar en varias salas.)
    void socket.join(`usuario:${usuario.sub}`);

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

    // Solo logging: Socket.IO limpia automáticamente al socket de todas sus salas.
    socket.on('disconnect', () => {
      registrador.info({ usuario: usuario.sub }, '[socket] desconectado');
    });
  });

  registrador.info('[socket] gateway de chat inicializado');
  return io;
}

/**
 * Devuelve la instancia global del servidor de Socket.IO, o `null` si todavía no se
 * ha llamado a {@link inicializarSockets} (p. ej. durante el arranque o en tests).
 * Otros módulos (como el servicio de notificaciones) deben comprobar el valor `null`
 * antes de usarla, ya que emitir eventos por socket es siempre best-effort.
 * @returns la instancia de `Server` de Socket.IO, o `null` si no está inicializada.
 */
export function obtenerIo(): Server | null {
  return io;
}
