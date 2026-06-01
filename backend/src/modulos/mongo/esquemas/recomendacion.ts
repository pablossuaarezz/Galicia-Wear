// Cumple "BBDD NoSQL + recomendaciones eco" de la rúbrica DAM.
import { Schema, model, Document } from 'mongoose';

interface IItemRecomendado {
  productoId: string;   // UUID referencia a PostgreSQL Producto
  puntuacion: number;   // 0.0 – 1.0
  razon: string;        // 'eco-match', 'same-city', 'same-material'
}

export interface IRecomendacion extends Document {
  clienteId: string;  // UUID referencia a PostgreSQL Cliente
  productos: IItemRecomendado[];
  preferencias: Record<string, unknown>; // snapshot de preferenciasSostenibilidad
  fechaGeneracion: Date;
  fechaExpiracion: Date;
}

const esquema = new Schema<IRecomendacion>(
  {
    clienteId:       { type: String, required: true, index: true },
    productos: [{
      productoId:  { type: String, required: true },
      puntuacion:  { type: Number, min: 0, max: 1, default: 0.5 },
      razon:       { type: String, default: 'eco-match' },
    }],
    preferencias:    { type: Schema.Types.Mixed, default: {} },
    fechaGeneracion: { type: Date, default: Date.now },
    fechaExpiracion: { type: Date, required: true },
  },
  { collection: 'recommendations', versionKey: false },
);

// TTL automático por fechaExpiracion (el valor 0 significa "usa el campo como timestamp de expiración")
esquema.index({ fechaExpiracion: 1 }, { expireAfterSeconds: 0 });

export const Recomendacion = model<IRecomendacion>('Recomendacion', esquema);
