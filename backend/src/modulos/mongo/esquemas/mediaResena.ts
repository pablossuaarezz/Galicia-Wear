// Fotos y vídeos de reseñas. Los binarios pesados no van en Postgres.
// Cumple "BBDD NoSQL (Mongo para multimedia)" de la rúbrica DAM.
//
// Esquema Mongoose para la colección `review_media`: cada reseña de producto (almacenada
// en PostgreSQL/Prisma) puede tener asociado un documento Mongo con sus archivos
// multimedia (fotos/vídeos), evitando guardar binarios o referencias pesadas en la BBDD
// relacional.
import { Schema, model, Document } from 'mongoose';

/**
 * Archivo multimedia individual asociado a una reseña.
 * - `url`: ubicación del archivo (almacenamiento externo/CDN).
 * - `tipo`: 'imagen' o 'video'.
 * - `tamanoBytes`: tamaño del archivo en bytes.
 * - `textoAlternativo`: texto alternativo (accesibilidad) opcional.
 */
interface IArchivoMedia {
  url: string;
  tipo: 'imagen' | 'video';
  tamanoBytes: number;
  textoAlternativo?: string;
}

/**
 * Forma de un documento de media de reseña.
 * - `resenaId`: UUID de la reseña en PostgreSQL a la que pertenece esta multimedia (relación 1:1).
 * - `archivos`: lista de archivos (imágenes/vídeos) adjuntos a la reseña.
 * - `fechaSubida`: fecha de creación del documento.
 */
export interface IMediaResena extends Document {
  resenaId: string; // UUID referencia a PostgreSQL Resena
  archivos: IArchivoMedia[];
  fechaSubida: Date;
}

// Definición del esquema Mongoose. `resenaId` es único e indexado: cada reseña tiene
// como máximo un documento de media asociado (relación 1:1 con la tabla Resena de Postgres).
const esquema = new Schema<IMediaResena>(
  {
    resenaId: { type: String, required: true, unique: true, index: true },
    archivos: [
      {
        url:               { type: String, required: true },
        tipo:              { type: String, enum: ['imagen', 'video'], default: 'imagen' },
        tamanoBytes:       { type: Number, required: true },
        textoAlternativo:  { type: String },
      },
    ],
    fechaSubida: { type: Date, default: Date.now },
  },
  { collection: 'review_media', versionKey: false },
);

/** Modelo Mongoose para la colección `review_media` (multimedia de reseñas). */
export const MediaResena = model<IMediaResena>('MediaResena', esquema);
