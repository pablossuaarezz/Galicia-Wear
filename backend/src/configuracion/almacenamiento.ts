import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Almacenamiento de imágenes subidas (fotos de prenda enviadas desde la app
 * como base64). Se guardan en disco bajo `uploads/` y se sirven de forma
 * estática; en SQL solo se guarda la URL (que cabe en la columna existente),
 * por lo que NO requiere migración de base de datos.
 */
export const DIR_SUBIDAS = path.resolve(process.cwd(), 'uploads');
const SUBCARPETA_PRODUCTOS = 'productos';

const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Decodifica un data URI base64 (`data:image/jpeg;base64,XXXX`), lo guarda como
 * archivo y devuelve su ruta pública relativa (`/uploads/productos/uuid.jpg`).
 */
export function guardarImagenBase64(dataUri: string): string {
  const coincidencia = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/s.exec(dataUri.trim());
  if (!coincidencia) {
    throw new Error('Formato de imagen base64 no válido');
  }
  const mime = coincidencia[1];
  const extension = EXTENSION_POR_MIME[mime] ?? 'jpg';
  const contenido = Buffer.from(coincidencia[2], 'base64');

  const carpeta = path.join(DIR_SUBIDAS, SUBCARPETA_PRODUCTOS);
  fs.mkdirSync(carpeta, { recursive: true });

  const nombre = `${crypto.randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(carpeta, nombre), contenido);

  return `/uploads/${SUBCARPETA_PRODUCTOS}/${nombre}`;
}
