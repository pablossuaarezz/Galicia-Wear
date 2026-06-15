// Tokens de dispositivo para push FCM. Se guardan en Mongo (colección device_tokens) en
// lugar de una columna Prisma para NO requerir migración sobre el MySQL remoto: el push es
// best-effort y hoy depende de un proyecto Firebase real (google-services.json es un stub).
// Un mismo usuario puede tener varios dispositivos → índice por usuario, token único.
import { Schema, model, Document } from 'mongoose';

/**
 * Forma de un documento de token de dispositivo (para notificaciones push vía FCM).
 * - `usuarioId`: UUID del usuario propietario del dispositivo (referencia a PostgreSQL Usuario).
 * - `token`: token FCM único del dispositivo/instalación de la app.
 * - `plataforma`: sistema operativo del dispositivo ('android' por defecto).
 * - `fechaActualizacion`: última vez que se registró/refrescó este token.
 */
export interface IDeviceToken extends Document {
  usuarioId: string; // UUID referencia a PostgreSQL Usuario
  token: string;
  plataforma: string;
  fechaActualizacion: Date;
}

// Definición del esquema Mongoose. `usuarioId` está indexado para buscar rápidamente
// todos los tokens de un usuario al enviar un push. `token` es único: si el mismo
// token reaparece (reinstalación de la app, cambio de usuario en el dispositivo) se
// hace upsert sobre el documento existente en lugar de duplicarlo (ver repositorioTokens).
const esquema = new Schema<IDeviceToken>(
  {
    usuarioId:          { type: String, required: true, index: true },
    token:              { type: String, required: true, unique: true },
    plataforma:         { type: String, default: 'android' },
    fechaActualizacion: { type: Date, default: Date.now },
  },
  { collection: 'device_tokens', versionKey: false },
);

/** Modelo Mongoose para la colección `device_tokens` (tokens FCM por dispositivo). */
export const DeviceToken = model<IDeviceToken>('DeviceToken', esquema);
