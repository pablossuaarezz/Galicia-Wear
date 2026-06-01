// Historial de notificaciones (push FCM + in-app). TTL 60 días.
// Cumple "BBDD NoSQL + notificaciones tiempo real" de la rúbrica DAM.
import { Schema, model, Document } from 'mongoose';

export const TIPOS_NOTIFICACION = [
  'PEDIDO_CREADO',
  'PEDIDO_PAGADO',
  'PEDIDO_ACEPTADO',
  'PEDIDO_ENVIADO',
  'PEDIDO_ENTREGADO',
  'PEDIDO_CANCELADO',
  'MENSAJE_NUEVO',
  'RESENA_RECIBIDA',
] as const;

export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export interface INotificacionLog extends Document {
  destinatarioId: string; // UUID referencia a PostgreSQL Usuario
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, unknown>;
  leida: boolean;
  fcmMessageId?: string;
  fechaCreacion: Date;
  fechaLectura?: Date;
}

const esquema = new Schema<INotificacionLog>(
  {
    destinatarioId: { type: String, required: true, index: true },
    tipo:           { type: String, required: true, enum: TIPOS_NOTIFICACION },
    titulo:         { type: String, required: true },
    cuerpo:         { type: String, required: true },
    datos:          { type: Schema.Types.Mixed },
    leida:          { type: Boolean, default: false, index: true },
    fcmMessageId:   { type: String },
    fechaCreacion:  { type: Date, default: Date.now, index: true },
    fechaLectura:   { type: Date },
  },
  { collection: 'notification_logs', versionKey: false },
);

// TTL automático: borra tras 60 días
esquema.index({ fechaCreacion: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export const NotificacionLog = model<INotificacionLog>('NotificacionLog', esquema);
