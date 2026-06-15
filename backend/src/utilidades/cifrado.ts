// JUSTIFICACIÓN: cifrado simétrico AES-256-GCM para datos sensibles (IBAN).
// La clave nunca se almacena en la BBDD — viene de la variable de entorno IBAN_ENCRYPTION_KEY.
// GCM proporciona autenticación del texto cifrado (detecta tampering).
import crypto from 'node:crypto';
import { entorno } from '../configuracion/entorno';

/** Algoritmo de cifrado simétrico usado: AES con clave de 256 bits en modo GCM. */
const ALGORITMO = 'aes-256-gcm';
/** Longitud del vector de inicialización (IV) en bytes: 96 bits, el tamaño recomendado para GCM. */
const LONGITUD_IV = 12; // 96 bits — recomendado para GCM

/**
 * Obtiene la clave de cifrado AES-256 a partir de la variable de entorno
 * `IBAN_ENCRYPTION_KEY` (cadena hexadecimal de 64 caracteres = 32 bytes).
 *
 * @returns la clave como `Buffer` de 32 bytes
 */
function obtenerClave(): Buffer {
  return Buffer.from(entorno.IBAN_ENCRYPTION_KEY, 'hex');
}

/**
 * Cifra un texto en claro usando AES-256-GCM con un IV aleatorio.
 *
 * Cada llamada genera un IV distinto (aleatorio), por lo que cifrar el mismo
 * texto dos veces produce salidas diferentes; esto es deseable por seguridad
 * (evita patrones repetidos en los datos cifrados).
 *
 * @param texto texto en claro a cifrar (p. ej. un IBAN)
 * @returns cadena con el formato `ivHex:tagHex:datosHex`, donde:
 *   - `ivHex` es el vector de inicialización en hexadecimal,
 *   - `tagHex` es la etiqueta de autenticación GCM (permite detectar manipulaciones),
 *   - `datosHex` es el texto cifrado en hexadecimal.
 */
// Devuelve: ivHex:tagHex:datosHex (los tres separados por ':')
export function cifrarTexto(texto: string): string {
  const clave = obtenerClave();
  // IV aleatorio en cada cifrado: imprescindible en GCM para no reutilizar
  // (clave, IV) y comprometer la seguridad del esquema.
  const iv = crypto.randomBytes(LONGITUD_IV);
  const cifrador = crypto.createCipheriv(ALGORITMO, clave, iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  // El "auth tag" de GCM permite verificar en el descifrado que el texto cifrado
  // no ha sido alterado (autenticación de los datos, no solo confidencialidad).
  const tag = cifrador.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${cifrado.toString('hex')}`;
}

/**
 * Descifra una cadena generada previamente por `cifrarTexto`.
 *
 * @param textoCifrado cadena con el formato `ivHex:tagHex:datosHex` producida por `cifrarTexto`
 * @returns el texto original en claro
 * @throws Error si el formato de `textoCifrado` no tiene exactamente 3 partes separadas
 *               por ':', o si `setAuthTag`/descifrado fallan porque los datos han sido
 *               manipulados o la clave no coincide con la usada al cifrar
 */
export function descifrarTexto(textoCifrado: string): string {
  const partes = textoCifrado.split(':');
  // Validación de formato: si no hay exactamente IV, tag y datos, el valor no
  // proviene de `cifrarTexto` o está corrupto.
  if (partes.length !== 3) throw new Error('Formato de texto cifrado inválido');
  const [ivHex, tagHex, datosHex] = partes;
  const clave = obtenerClave();
  const descifrador = crypto.createDecipheriv(ALGORITMO, clave, Buffer.from(ivHex, 'hex'));
  // Si el auth tag no coincide (datos manipulados o clave incorrecta),
  // `descifrador.final()` lanzará una excepción.
  descifrador.setAuthTag(Buffer.from(tagHex, 'hex'));
  return (
    descifrador.update(Buffer.from(datosHex, 'hex')).toString('utf8') +
    descifrador.final('utf8')
  );
}
