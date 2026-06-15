import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Almacenamiento de imágenes subidas (fotos de prenda enviadas desde la app
 * como base64). Se guardan en disco bajo `uploads/` y se sirven de forma
 * estática; en SQL solo se guarda la URL (que cabe en la columna existente),
 * por lo que NO requiere migración de base de datos.
 */

/** Ruta absoluta al directorio raíz donde se guardan todos los archivos subidos. */
export const DIR_SUBIDAS = path.resolve(process.cwd(), 'uploads');
/** Subcarpeta dentro de `uploads/` donde se almacenan específicamente las imágenes de producto. */
const SUBCARPETA_PRODUCTOS = 'productos';

/**
 * Mapa de tipos MIME de imagen soportados a su extensión de archivo correspondiente.
 * Se usa para nombrar el archivo guardado en disco a partir del MIME indicado en el data URI.
 */
const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Decodifica un data URI base64 (`data:image/jpeg;base64,XXXX`), lo guarda como
 * archivo y devuelve su ruta pública relativa (`/uploads/productos/uuid.jpg`).
 *
 * @param dataUri cadena en formato data URI (`data:<mime>;base64,<datos>`) recibida
 *                 desde el cliente (por ejemplo, una foto de prenda capturada en la app)
 * @returns ruta pública relativa del archivo guardado, lista para almacenarse en la
 *          columna correspondiente de la base de datos (p. ej. `/uploads/productos/<uuid>.jpg`)
 * @throws Error si la cadena no cumple el formato `data:image/<tipo>;base64,<contenido>`
 */
export function guardarImagenBase64(dataUri: string): string {
  // Se valida el formato con una expresión regular antes de procesar nada: si el
  // cliente envía datos corruptos o un formato no soportado, se aborta pronto con
  // un mensaje claro en lugar de fallar de forma confusa al decodificar/escribir.
  const coincidencia = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/s.exec(dataUri.trim());
  if (!coincidencia) {
    throw new Error('Formato de imagen base64 no válido');
  }
  const mime = coincidencia[1];
  // Si el MIME no está en el mapa de extensiones conocidas, se usa 'jpg' como
  // valor por defecto razonable en lugar de fallar.
  const extension = EXTENSION_POR_MIME[mime] ?? 'jpg';
  const contenido = Buffer.from(coincidencia[2], 'base64');

  // Se crea la carpeta de destino si no existe (recursive: true evita errores si
  // tampoco existe el directorio padre `uploads/`).
  const carpeta = path.join(DIR_SUBIDAS, SUBCARPETA_PRODUCTOS);
  fs.mkdirSync(carpeta, { recursive: true });

  // Se genera un nombre de archivo único con UUID para evitar colisiones entre
  // imágenes subidas por distintos usuarios o en distintos momentos.
  const nombre = `${crypto.randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(carpeta, nombre), contenido);

  // Se devuelve la ruta pública (no la ruta absoluta del disco), ya que es lo que
  // se sirve estáticamente desde `/uploads` y lo que se guarda en la base de datos.
  return `/uploads/${SUBCARPETA_PRODUCTOS}/${nombre}`;
}
