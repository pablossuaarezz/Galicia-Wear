// JUSTIFICACIÓN: cifrado simétrico AES-256-GCM para datos sensibles (IBAN).
// La clave nunca se almacena en la BBDD — viene de la variable de entorno IBAN_ENCRYPTION_KEY.
// GCM proporciona autenticación del texto cifrado (detecta tampering).
import crypto from 'node:crypto';
import { entorno } from '../configuracion/entorno';

const ALGORITMO = 'aes-256-gcm';
const LONGITUD_IV = 12; // 96 bits — recomendado para GCM

function obtenerClave(): Buffer {
  return Buffer.from(entorno.IBAN_ENCRYPTION_KEY, 'hex');
}

// Devuelve: ivHex:tagHex:datosHex (los tres separados por ':')
export function cifrarTexto(texto: string): string {
  const clave = obtenerClave();
  const iv = crypto.randomBytes(LONGITUD_IV);
  const cifrador = crypto.createCipheriv(ALGORITMO, clave, iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${cifrado.toString('hex')}`;
}

export function descifrarTexto(textoCifrado: string): string {
  const partes = textoCifrado.split(':');
  if (partes.length !== 3) throw new Error('Formato de texto cifrado inválido');
  const [ivHex, tagHex, datosHex] = partes;
  const clave = obtenerClave();
  const descifrador = crypto.createDecipheriv(ALGORITMO, clave, Buffer.from(ivHex, 'hex'));
  descifrador.setAuthTag(Buffer.from(tagHex, 'hex'));
  return (
    descifrador.update(Buffer.from(datosHex, 'hex')).toString('utf8') +
    descifrador.final('utf8')
  );
}
