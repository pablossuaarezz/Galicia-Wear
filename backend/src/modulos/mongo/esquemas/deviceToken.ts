// Tokens de dispositivo para push FCM. Se guardan en Mongo (colección device_tokens) en
// lugar de una columna Prisma para NO requerir migración sobre el MySQL remoto: el push es
// best-effort y hoy depende de un proyecto Firebase real (google-services.json es un stub).
// Un mismo usuario puede tener varios dispositivos → índice por usuario, token único.
import { Schema, model, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  usuarioId: string; // UUID referencia a PostgreSQL Usuario
  token: string;
  plataforma: string;
  fechaActualizacion: Date;
}

const esquema = new Schema<IDeviceToken>(
  {
    usuarioId:          { type: String, required: true, index: true },
    token:              { type: String, required: true, unique: true },
    plataforma:         { type: String, default: 'android' },
    fechaActualizacion: { type: Date, default: Date.now },
  },
  { collection: 'device_tokens', versionKey: false },
);

export const DeviceToken = model<IDeviceToken>('DeviceToken', esquema);
