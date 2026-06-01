// Fotos y vídeos de reseñas. Los binarios pesados no van en Postgres.
// Cumple "BBDD NoSQL (Mongo para multimedia)" de la rúbrica DAM.
import { Schema, model, Document } from 'mongoose';

interface IArchivoMedia {
  url: string;
  tipo: 'imagen' | 'video';
  tamanoBytes: number;
  textoAlternativo?: string;
}

export interface IMediaResena extends Document {
  resenaId: string; // UUID referencia a PostgreSQL Resena
  archivos: IArchivoMedia[];
  fechaSubida: Date;
}

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

export const MediaResena = model<IMediaResena>('MediaResena', esquema);
