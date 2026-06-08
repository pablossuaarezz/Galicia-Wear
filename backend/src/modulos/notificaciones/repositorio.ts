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

export interface DatosCrearNotificacion {
  destinatarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, unknown>;
  fcmMessageId?: string;
}

export const repositorioNotificaciones = {
  async crear(datos: DatosCrearNotificacion): Promise<INotificacionLog> {
    return NotificacionLog.create({ ...datos, leida: false });
  },

  async listarDe(
    usuarioId: string,
    opciones: { pagina: number; limite: number },
  ): Promise<{ datos: INotificacionLog[]; total: number }> {
    const omitir = (opciones.pagina - 1) * opciones.limite;
    const condicion = { destinatarioId: usuarioId };
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

  async contarNoLeidas(usuarioId: string): Promise<number> {
    return NotificacionLog.countDocuments({ destinatarioId: usuarioId, leida: false });
  },

  // Marca una notificación como leída solo si pertenece al usuario y aún no lo estaba.
  // Devuelve false si el id no es un ObjectId válido o no se modificó nada.
  async marcarLeida(id: string, usuarioId: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const resultado = await NotificacionLog.updateOne(
      { _id: id, destinatarioId: usuarioId, leida: false },
      { $set: { leida: true, fechaLectura: new Date() } },
    );
    return resultado.modifiedCount > 0;
  },

  async marcarTodasLeidas(usuarioId: string): Promise<number> {
    const resultado = await NotificacionLog.updateMany(
      { destinatarioId: usuarioId, leida: false },
      { $set: { leida: true, fechaLectura: new Date() } },
    );
    return resultado.modifiedCount;
  },

  // Marca el messageId devuelto por FCM (best-effort; no rompe si el doc ya no existe).
  async guardarFcmMessageId(id: Types.ObjectId | string, fcmMessageId: string): Promise<void> {
    await NotificacionLog.updateOne({ _id: id }, { $set: { fcmMessageId } });
  },
};
