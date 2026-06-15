// Cumple "BBDD NoSQL + logs de auditoría" de la rúbrica DAM.
//
// Esquema Mongoose para la colección `activity_logs`: registra eventos relevantes de la
// aplicación (inicios de sesión, registros, creación/modificación de recursos, etc.) con
// fines de auditoría. Cada documento es un evento puntual e inmutable. La colección tiene
// un índice TTL que purga automáticamente los registros con más de 90 días para que no
// crezca indefinidamente.
import { Schema, model, Document } from 'mongoose';

/**
 * Forma de un documento de log de actividad almacenado en Mongo.
 * - `usuarioId`: id del usuario que realizó la acción (puede no existir, p. ej. acciones anónimas).
 * - `accion`: tipo de evento ('LOGIN', 'LOGOUT', 'REGISTRO', 'CREAR_PRODUCTO', etc.).
 * - `recurso`: entidad afectada ('usuario', 'producto', 'pedido', 'disenador').
 * - `recursoId`: identificador concreto del recurso afectado, si aplica.
 * - `detalles`: información adicional libre (objeto arbitrario) para contexto del evento.
 * - `ipOrigen` / `agenteUsuario`: datos de la petición HTTP que originó el evento.
 * - `fechaCreacion`: momento en que se registró el evento.
 */
export interface IActividadLog extends Document {
  usuarioId?: string;
  accion: string;   // 'LOGIN', 'LOGOUT', 'REGISTRO', 'CREAR_PRODUCTO', etc.
  recurso: string;  // 'usuario', 'producto', 'pedido', 'disenador'
  recursoId?: string;
  detalles?: Record<string, unknown>;
  ipOrigen?: string;
  agenteUsuario?: string;
  fechaCreacion: Date;
}

// Definición del esquema Mongoose: índices en `usuarioId`, `accion` y `fechaCreacion`
// para permitir consultas habituales del panel de auditoría (por usuario, por tipo de
// acción y ordenadas por fecha). `versionKey: false` evita el campo `__v` de Mongoose,
// ya que estos documentos no se modifican tras su creación.
const esquema = new Schema<IActividadLog>(
  {
    usuarioId:     { type: String, index: true },
    accion:        { type: String, required: true, index: true },
    recurso:       { type: String, required: true },
    recursoId:     { type: String },
    detalles:      { type: Schema.Types.Mixed },
    ipOrigen:      { type: String },
    agenteUsuario: { type: String },
    fechaCreacion: { type: Date, default: Date.now, index: true },
  },
  { collection: 'activity_logs', versionKey: false },
);

// TTL automático: borra registros con más de 90 días
// (MongoDB ejecuta periódicamente un proceso en segundo plano que elimina los documentos
// cuyo campo `fechaCreacion` tiene más de `expireAfterSeconds` segundos de antigüedad).
esquema.index({ fechaCreacion: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/** Modelo Mongoose para la colección `activity_logs` (registro de auditoría de actividad). */
export const ActividadLog = model<IActividadLog>('ActividadLog', esquema);
