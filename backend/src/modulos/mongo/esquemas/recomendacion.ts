// Cumple "BBDD NoSQL + recomendaciones eco" de la rúbrica DAM.
//
// Esquema Mongoose para la colección `recommendations`: almacena, por cliente, un
// conjunto de productos recomendados (calculados en función de preferencias de
// sostenibilidad, ciudad, materiales, etc.) junto con una puntuación y la razón de la
// recomendación. Cada documento tiene una fecha de expiración explícita y se elimina
// automáticamente al alcanzarla (TTL), de forma que las recomendaciones se recalculan
// periódicamente.
import { Schema, model, Document } from 'mongoose';

/**
 * Producto recomendado dentro del listado de un cliente.
 * - `productoId`: UUID del producto recomendado (referencia a PostgreSQL Producto).
 * - `puntuacion`: valor entre 0.0 y 1.0 que indica la afinidad/relevancia de la recomendación.
 * - `razon`: criterio que generó la recomendación ('eco-match', 'same-city', 'same-material').
 */
interface IItemRecomendado {
  productoId: string;   // UUID referencia a PostgreSQL Producto
  puntuacion: number;   // 0.0 – 1.0
  razon: string;        // 'eco-match', 'same-city', 'same-material'
}

/**
 * Forma de un documento de recomendaciones para un cliente.
 * - `clienteId`: UUID del cliente al que pertenece esta lista de recomendaciones.
 * - `productos`: listado de productos recomendados con su puntuación y razón.
 * - `preferencias`: copia ("snapshot") de las preferencias de sostenibilidad del cliente
 *   en el momento de generar la recomendación, para poder auditar/depurar el cálculo.
 * - `fechaGeneracion`: momento en que se calculó la recomendación.
 * - `fechaExpiracion`: momento a partir del cual el documento debe considerarse obsoleto
 *   y se elimina automáticamente (TTL).
 */
export interface IRecomendacion extends Document {
  clienteId: string;  // UUID referencia a PostgreSQL Cliente
  productos: IItemRecomendado[];
  preferencias: Record<string, unknown>; // snapshot de preferenciasSostenibilidad
  fechaGeneracion: Date;
  fechaExpiracion: Date;
}

// Definición del esquema Mongoose. `clienteId` está indexado para recuperar rápidamente
// las recomendaciones vigentes de un cliente. `preferencias` se guarda como tipo Mixed
// porque su estructura depende de las preferencias de sostenibilidad del cliente, que
// pueden variar.
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
// Es decir, MongoDB elimina el documento en el instante indicado por `fechaExpiracion`
// (a diferencia de los otros TTL del proyecto, que cuentan segundos desde una fecha fija).
esquema.index({ fechaExpiracion: 1 }, { expireAfterSeconds: 0 });

/** Modelo Mongoose para la colección `recommendations` (recomendaciones de productos por cliente). */
export const Recomendacion = model<IRecomendacion>('Recomendacion', esquema);
