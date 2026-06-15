// Punto ÚNICO de creación de notificaciones. Todos los triggers (pedidos, envíos, chat)
// llaman a `crear(...)`. Hace tres cosas, ninguna de ellas debe tumbar la request que la
// dispara (tolerancia a Mongo/socket caídos):
//   1. Persiste un NotificacionLog en Mongo.
//   2. Emite `nueva_notificacion` a la sala personal `usuario:<destinatarioId>` (Socket.IO).
//   3. Intenta push FCM best-effort (se omite si no hay token/proyecto).
import { obtenerIo } from '../../tiempoReal/servidorSockets';
import { registrador } from '../../utilidades/registrador';
import { repositorioNotificaciones, type DatosCrearNotificacion } from './repositorio';
import { enviarPush } from './fcm';
import type { INotificacionLog, TipoNotificacion } from '../mongo/esquemas/notificacionLog';

// DTO estable que viaja por REST y por socket (no expone internals de Mongo).
/**
 * Representación pública de una notificación, expuesta tanto por la API REST
 * (`GET /notificaciones`) como por el evento de Socket.IO `nueva_notificacion`. No
 * expone detalles internos de Mongo (p. ej. `_id` se traduce a `id`, y las fechas se
 * serializan como ISO strings).
 */
export interface NotificacionDto {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos: Record<string, unknown>;
  leida: boolean;
  fechaCreacion: string;
}

// Acepta tanto documentos Mongoose como objetos `.lean()`.
/**
 * Convierte un documento de notificación (Mongoose o `.lean()`) al DTO público
 * {@link NotificacionDto}, normalizando valores ausentes y formateando la fecha.
 * @param doc documento de `NotificacionLog` (instancia Mongoose o objeto plano `.lean()`).
 * @returns DTO listo para enviar por REST o por socket.
 */
function aDto(doc: INotificacionLog | Record<string, any>): NotificacionDto {
  return {
    id: String(doc._id),
    tipo: doc.tipo,
    titulo: doc.titulo,
    cuerpo: doc.cuerpo,
    datos: doc.datos ?? {},
    leida: Boolean(doc.leida),
    fechaCreacion: new Date(doc.fechaCreacion).toISOString(),
  };
}

/**
 * Servicio de notificaciones: capa de orquestación entre el repositorio Mongo, el
 * gateway de Socket.IO y el envío de push FCM. Es el punto de entrada usado por el
 * resto de módulos (pedidos, chat, reseñas...) cuando necesitan notificar a un usuario.
 */
export const servicioNotificaciones = {
  // Devuelve el DTO emitido, o null si no se pudo persistir (Mongo caído). El llamante
  // (trigger) debe ignorar el resultado y nunca propagar el error.
  /**
   * Crea una notificación completa: la persiste en Mongo, la emite en tiempo real por
   * Socket.IO a la sala personal del destinatario y, en paralelo, intenta enviarla
   * como push FCM (best-effort). Ninguno de los tres pasos debe poder tumbar al
   * llamante (los triggers de negocio nunca deben fallar por culpa de notificaciones).
   * @param entrada datos de la notificación a crear (destinatario, tipo, título, cuerpo, datos extra).
   * @returns el DTO de la notificación creada, o `null` si ni siquiera se pudo persistir
   *   en Mongo (p. ej. base de datos caída); en ese caso el llamante debe ignorar el resultado.
   */
  async crear(entrada: DatosCrearNotificacion): Promise<NotificacionDto | null> {
    let doc: INotificacionLog;
    // 1. Persistencia: si Mongo está caído, se registra el aviso y se aborta sin
    // lanzar, ya que el flujo de negocio que originó la notificación no debe romperse.
    try {
      doc = await repositorioNotificaciones.crear(entrada);
    } catch (error) {
      registrador.warn({ err: error, tipo: entrada.tipo }, '[notif] no se pudo persistir (ignorado)');
      return null;
    }

    const dto = aDto(doc);

    // 2. Tiempo real: a cualquier dispositivo conectado del usuario.
    // Se emite a la sala `usuario:<id>`, a la que el gateway de sockets une
    // automáticamente todas las conexiones de ese usuario (ver servidorSockets.ts).
    try {
      obtenerIo()?.to(`usuario:${entrada.destinatarioId}`).emit('nueva_notificacion', dto);
    } catch (error) {
      registrador.warn({ err: error }, '[notif] no se pudo emitir por socket (ignorado)');
    }

    // 3. Push FCM best-effort (fire-and-forget: no bloquea al trigger).
    // Si el envío devuelve un messageId (éxito), se guarda en el log para trazabilidad;
    // si falla o no hay tokens/proyecto Firebase configurado, se ignora silenciosamente.
    void enviarPush({
      destinatarioId: entrada.destinatarioId,
      tipo: entrada.tipo,
      titulo: entrada.titulo,
      cuerpo: entrada.cuerpo,
      datos: entrada.datos,
    })
      .then((fcmMessageId) => {
        if (fcmMessageId) {
          return repositorioNotificaciones.guardarFcmMessageId((doc as any)._id, fcmMessageId);
        }
        return undefined;
      })
      .catch(() => undefined);

    return dto;
  },

  /**
   * Lista paginada de notificaciones de un usuario, convertidas a {@link NotificacionDto}.
   * @param usuarioId destinatario.
   * @param opciones paginación (`pagina`, `limite`).
   * @returns notificaciones de la página y el total disponible.
   */
  async listar(
    usuarioId: string,
    opciones: { pagina: number; limite: number },
  ): Promise<{ notificaciones: NotificacionDto[]; total: number }> {
    const { datos, total } = await repositorioNotificaciones.listarDe(usuarioId, opciones);
    return { notificaciones: datos.map(aDto), total };
  },

  /** Número de notificaciones no leídas de un usuario (para el badge). */
  async contador(usuarioId: string): Promise<number> {
    return repositorioNotificaciones.contarNoLeidas(usuarioId);
  },

  /** Marca una notificación como leída si pertenece al usuario indicado. */
  async marcarLeida(id: string, usuarioId: string): Promise<boolean> {
    return repositorioNotificaciones.marcarLeida(id, usuarioId);
  },

  /** Marca todas las notificaciones pendientes de un usuario como leídas. */
  async marcarTodasLeidas(usuarioId: string): Promise<number> {
    return repositorioNotificaciones.marcarTodasLeidas(usuarioId);
  },
};
