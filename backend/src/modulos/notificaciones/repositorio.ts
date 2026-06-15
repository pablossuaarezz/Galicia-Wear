// Repositorio sobre el modelo Mongoose `NotificacionLog` (colección notification_logs).
// No extiende RepositorioBase (eso es para Prisma): aquí la fuente es Mongo, igual que el
// visor de logs del panel admin. Todas las operaciones se acotan por `destinatarioId`
// para que un usuario solo toque sus propias notificaciones.
import { isValidObjectId, Types } from 'mongoose';
import {
  NotificacionLog,
  type INotificacionLog,
  type TipoNotificacion,
} from '../mongo/esquemas/notificacionLog';

/** Datos necesarios para crear un nuevo registro de notificación en Mongo. */
export interface DatosCrearNotificacion {
  destinatarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, unknown>;
  fcmMessageId?: string;
}

/**
 * Operaciones de acceso a datos sobre la colección `notification_logs` (Mongo).
 * Todas las operaciones de lectura/escritura sobre notificaciones de un usuario
 * concreto filtran por `destinatarioId` para garantizar el aislamiento entre usuarios.
 */
export const repositorioNotificaciones = {
  /**
   * Inserta un nuevo documento de notificación, marcado inicialmente como no leído.
   * @param datos datos base de la notificación (destinatario, tipo, título, cuerpo, etc.).
   * @returns el documento creado.
   */
  async crear(datos: DatosCrearNotificacion): Promise<INotificacionLog> {
    return NotificacionLog.create({ ...datos, leida: false });
  },

  /**
   * Lista paginada de notificaciones de un usuario, ordenadas de más reciente a más antigua.
   * @param usuarioId destinatario cuyas notificaciones se consultan.
   * @param opciones paginación (`pagina` 1-based y `limite` de elementos por página).
   * @returns objeto con los documentos de la página (`datos`, en formato `.lean()`) y el `total` de notificaciones del usuario.
   */
  async listarDe(
    usuarioId: string,
    opciones: { pagina: number; limite: number },
  ): Promise<{ datos: INotificacionLog[]; total: number }> {
    const omitir = (opciones.pagina - 1) * opciones.limite;
    const condicion = { destinatarioId: usuarioId };
    // Se ejecutan en paralelo la consulta paginada y el conteo total, ya que son
    // independientes y ambas se necesitan para construir la respuesta paginada.
    const [datos, total] = await Promise.all([
      NotificacionLog.find(condicion)
        .sort({ fechaCreacion: -1 })
        .skip(omitir)
        .limit(opciones.limite)
        .lean(),
      NotificacionLog.countDocuments(condicion),
    ]);
    return { datos: datos as unknown as INotificacionLog[], total };
  },

  /**
   * Cuenta cuántas notificaciones de un usuario están sin leer (para el badge de la UI).
   * @param usuarioId destinatario.
   * @returns número de notificaciones no leídas.
   */
  async contarNoLeidas(usuarioId: string): Promise<number> {
    return NotificacionLog.countDocuments({ destinatarioId: usuarioId, leida: false });
  },

  // Marca una notificación como leída solo si pertenece al usuario y aún no lo estaba.
  // Devuelve false si el id no es un ObjectId válido o no se modificó nada.
  /**
   * Marca como leída una notificación concreta, comprobando pertenencia al usuario.
   * @param id identificador (`_id` de Mongo) de la notificación.
   * @param usuarioId destinatario que solicita marcarla como leída.
   * @returns `true` si se modificó el documento; `false` si el id no es válido, no existe,
   *   no pertenece al usuario o ya estaba marcada como leída.
   */
  async marcarLeida(id: string, usuarioId: string): Promise<boolean> {
    // Validación defensiva: un id mal formado provocaría una excepción de Mongoose
    // al construir la query, así que se descarta antes de tocar la base de datos.
    if (!isValidObjectId(id)) return false;
    const resultado = await NotificacionLog.updateOne(
      { _id: id, destinatarioId: usuarioId, leida: false },
      { $set: { leida: true, fechaLectura: new Date() } },
    );
    return resultado.modifiedCount > 0;
  },

  /**
   * Marca como leídas todas las notificaciones pendientes de un usuario.
   * @param usuarioId destinatario.
   * @returns número de documentos modificados.
   */
  async marcarTodasLeidas(usuarioId: string): Promise<number> {
    const resultado = await NotificacionLog.updateMany(
      { destinatarioId: usuarioId, leida: false },
      { $set: { leida: true, fechaLectura: new Date() } },
    );
    return resultado.modifiedCount;
  },

  // Marca el messageId devuelto por FCM (best-effort; no rompe si el doc ya no existe).
  /**
   * Asocia al log de notificación el `messageId` devuelto por Firebase Cloud Messaging
   * tras un envío push exitoso, para trazabilidad. Operación best-effort: si el
   * documento ya no existe, `updateOne` simplemente no modifica nada (no lanza error).
   * @param id `_id` del documento de notificación.
   * @param fcmMessageId identificador del mensaje devuelto por FCM.
   */
  async guardarFcmMessageId(id: Types.ObjectId | string, fcmMessageId: string): Promise<void> {
    await NotificacionLog.updateOne({ _id: id }, { $set: { fcmMessageId } });
  },
};
