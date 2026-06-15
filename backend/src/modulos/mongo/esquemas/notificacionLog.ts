// Historial de notificaciones (push FCM + in-app). TTL 60 días.
// Cumple "BBDD NoSQL + notificaciones tiempo real" de la rúbrica DAM.
//
// Esquema Mongoose para la colección `notification_logs`: registra todas las
// notificaciones generadas para los usuarios (cambios de estado de pedido, mensajes de
// chat, reseñas recibidas, etc.), tanto si se entregaron in-app (Socket.IO) como por
// push (FCM). Sirve de bandeja de notificaciones consultable y se purga tras 60 días
// mediante un índice TTL.
import { Schema, model, Document } from 'mongoose';

/**
 * Catálogo cerrado de tipos de notificación soportados por la aplicación. Se usa tanto
 * para validar el campo `tipo` del esquema Mongo (enum) como para tipar `TipoNotificacion`
 * en el resto del backend.
 */
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

/** Tipo unión derivado de {@link TIPOS_NOTIFICACION}: uno de los valores válidos de `tipo`. */
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

/**
 * Forma de un documento de log de notificación.
 * - `destinatarioId`: UUID del usuario que recibe la notificación (referencia a PostgreSQL Usuario).
 * - `tipo`: categoría de la notificación (uno de {@link TIPOS_NOTIFICACION}).
 * - `titulo` / `cuerpo`: texto mostrado al usuario.
 * - `datos`: payload adicional libre (p. ej. ids para deep-linking en la app).
 * - `leida`: indica si el usuario ya ha visto/abierto la notificación.
 * - `fcmMessageId`: identificador devuelto por Firebase Cloud Messaging si el push se envió con éxito.
 * - `fechaCreacion`: momento de generación de la notificación (también usada por el TTL).
 * - `fechaLectura`: momento en que el usuario la marcó como leída.
 */
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

// Definición del esquema Mongoose. Índices en `destinatarioId` (listar la bandeja de un
// usuario), `leida` (contar no leídas para el badge) y `fechaCreacion` (orden cronológico
// y soporte del TTL). `tipo` está restringido al enum TIPOS_NOTIFICACION para evitar
// valores inconsistentes.
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
// (las notificaciones antiguas pierden relevancia y se eliminan para no crecer sin límite).
esquema.index({ fechaCreacion: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

/** Modelo Mongoose para la colección `notification_logs` (historial de notificaciones). */
export const NotificacionLog = model<INotificacionLog>('NotificacionLog', esquema);
