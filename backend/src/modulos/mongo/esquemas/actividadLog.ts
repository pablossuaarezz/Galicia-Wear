// Cumple "BBDD NoSQL + logs de auditoría" de la rúbrica DAM.
import { Schema, model, Document } from 'mongoose';

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
esquema.index({ fechaCreacion: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActividadLog = model<IActividadLog>('ActividadLog', esquema);
