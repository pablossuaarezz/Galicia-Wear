// Carrito para visitantes no autenticados. TTL 30 días.
// Cumple "BBDD NoSQL + datos efímeros" de la rúbrica DAM.
import { Schema, model, Document } from 'mongoose';

interface IItemCarritoAnonimo {
  productoId: string;
  varianteId: string;
  cantidad: number;
  fechaAnadido: Date;
}

export interface ICarritoAnonimo extends Document {
  sessionId: string;  // cookie/localStorage del visitante
  items: IItemCarritoAnonimo[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const esquema = new Schema<ICarritoAnonimo>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: [
      {
        productoId:  { type: String, required: true },
        varianteId:  { type: String, required: true },
        cantidad:    { type: Number, required: true, min: 1 },
        fechaAnadido: { type: Date, default: Date.now },
      },
    ],
    fechaCreacion:      { type: Date, default: Date.now },
    fechaActualizacion: { type: Date, default: Date.now },
  },
  { collection: 'anonymous_carts', versionKey: false },
);

// TTL: expira 30 días después de la última actualización
esquema.index({ fechaActualizacion: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const CarritoAnonimo = model<ICarritoAnonimo>('CarritoAnonimo', esquema);
