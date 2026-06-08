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

export const servicioNotificaciones = {
  // Devuelve el DTO emitido, o null si no se pudo persistir (Mongo caído). El llamante
  // (trigger) debe ignorar el resultado y nunca propagar el error.
  async crear(entrada: DatosCrearNotificacion): Promise<NotificacionDto | null> {
    let doc: INotificacionLog;
    try {
      doc = await repositorioNotificaciones.crear(entrada);
    } catch (error) {
      registrador.warn({ err: error, tipo: entrada.tipo }, '[notif] no se pudo persistir (ignorado)');
      return null;
    }

    const dto = aDto(doc);

    // 2. Tiempo real: a cualquier dispositivo conectado del usuario.
    try {
      obtenerIo()?.to(`usuario:${entrada.destinatarioId}`).emit('nueva_notificacion', dto);
    } catch (error) {
      registrador.warn({ err: error }, '[notif] no se pudo emitir por socket (ignorado)');
    }

    // 3. Push FCM best-effort (fire-and-forget: no bloquea al trigger).
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

  async listar(
    usuarioId: string,
    opciones: { pagina: number; limite: number },
  ): Promise<{ notificaciones: NotificacionDto[]; total: number }> {
    const { datos, total } = await repositorioNotificaciones.listarDe(usuarioId, opciones);
    return { notificaciones: datos.map(aDto), total };
  },

  async contador(usuarioId: string): Promise<number> {
    return repositorioNotificaciones.contarNoLeidas(usuarioId);
  },

  async marcarLeida(id: string, usuarioId: string): Promise<boolean> {
    return repositorioNotificaciones.marcarLeida(id, usuarioId);
  },

  async marcarTodasLeidas(usuarioId: string): Promise<number> {
    return repositorioNotificaciones.marcarTodasLeidas(usuarioId);
  },
};
