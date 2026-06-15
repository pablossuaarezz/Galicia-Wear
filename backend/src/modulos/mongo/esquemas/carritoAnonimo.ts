// Carrito para visitantes no autenticados. TTL 30 días.
// Cumple "BBDD NoSQL + datos efímeros" de la rúbrica DAM.
//
// Esquema Mongoose para la colección `anonymous_carts`: permite que un visitante sin
// cuenta añada productos al carrito identificándose solo mediante un `sessionId`
// (cookie o almacenamiento local del navegador/app). Si el carrito no se usa durante
// 30 días, se elimina automáticamente vía índice TTL.
import { Schema, model, Document } from 'mongoose';

/**
 * Línea de producto dentro de un carrito anónimo.
 * - `productoId` / `varianteId`: referencias al producto y a su variante concreta (talla, color...).
 * - `cantidad`: unidades solicitadas (mínimo 1).
 * - `fechaAnadido`: momento en que se añadió la línea al carrito.
 */
interface IItemCarritoAnonimo {
  productoId: string;
  varianteId: string;
  cantidad: number;
  fechaAnadido: Date;
}

/**
 * Forma de un documento de carrito anónimo.
 * - `sessionId`: identificador único de la sesión del visitante (no autenticado).
 * - `items`: líneas de productos añadidas al carrito.
 * - `fechaCreacion` / `fechaActualizacion`: control de vida del carrito (usada por el TTL).
 */
export interface ICarritoAnonimo extends Document {
  sessionId: string;  // cookie/localStorage del visitante
  items: IItemCarritoAnonimo[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Definición del esquema Mongoose. `sessionId` es único e indexado: cada visitante tiene
// como máximo un carrito anónimo activo. Los `items` se modelan como un subdocumento
// embebido (array) ya que siempre se leen/escriben junto con el carrito completo.
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
// (evita acumular carritos abandonados de visitantes que nunca vuelven).
esquema.index({ fechaActualizacion: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

/** Modelo Mongoose para la colección `anonymous_carts` (carritos de visitantes anónimos). */
export const CarritoAnonimo = model<ICarritoAnonimo>('CarritoAnonimo', esquema);
