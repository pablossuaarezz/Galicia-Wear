// Push FCM best-effort. TODO el módulo está diseñado para fallar en silencio:
//   - Si no hay FIREBASE_SERVICE_ACCOUNT configurado → se omite.
//   - Si firebase-admin no está instalado → se omite (import dinámico capturado).
//   - Si el usuario no tiene tokens registrados → se omite.
// Nunca lanza: el camino fiable de la demo es in-app + Socket.IO. El push real requiere un
// proyecto Firebase real (google-services.json en la app es un STUB con project_number 0).
import { readFileSync } from 'fs';
import { entorno } from '../../configuracion/entorno';
import { registrador } from '../../utilidades/registrador';
import { repositorioTokens } from './tokens';
import type { TipoNotificacion } from '../mongo/esquemas/notificacionLog';

/** Datos necesarios para construir y enviar una notificación push vía FCM. */
export interface OpcionesPush {
  destinatarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, unknown>;
}

// `firebase-admin` se carga de forma perezosa y dinámica para que el backend NO dependa
// de él en compilación ni arranque. El especificador en variable evita que TypeScript
// intente resolver el módulo (que puede no estar instalado).
let inicializado = false;
/**
 * Obtiene (e inicializa si es necesario) el SDK `firebase-admin`, de forma perezosa.
 * - Si no hay `FIREBASE_SERVICE_ACCOUNT` configurado en el entorno, devuelve `null`
 *   sin intentar cargar el módulo (push deshabilitado por configuración).
 * - Si el módulo no está instalado o falla la inicialización (credenciales inválidas,
 *   etc.), se captura el error, se registra como warning y se devuelve `null`.
 * - La inicialización de `admin.initializeApp` solo se ejecuta una vez (guardada con
 *   la bandera `inicializado`), y se comprueba `admin.apps?.length` para evitar
 *   reinicializar la app de Firebase si ya existe.
 * @returns el módulo `firebase-admin` ya inicializado, o `null` si el push no está disponible.
 */
async function obtenerAdmin(): Promise<any | null> {
  if (!entorno.FIREBASE_SERVICE_ACCOUNT) return null;
  try {
    const especificador = 'firebase-admin';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = await import(especificador);
    if (!inicializado) {
      inicializado = true;
      const cuenta = JSON.parse(readFileSync(entorno.FIREBASE_SERVICE_ACCOUNT, 'utf-8'));
      if (!admin.apps?.length) {
        admin.initializeApp({ credential: admin.credential.cert(cuenta) });
      }
    }
    return admin;
  } catch (error) {
    registrador.warn({ err: error }, '[fcm] firebase-admin no disponible; push omitido');
    return null;
  }
}

// FCM exige que el payload `data` sean strings. Aplanamos `datos` y añadimos `tipo` para que
// la app pueda construir el deep-link sin abrir la notificación.
/**
 * Construye el payload `data` de FCM a partir de las `OpcionesPush`. FCM exige que todos
 * los valores del campo `data` sean strings, por lo que cada valor de `opciones.datos`
 * se convierte explícitamente con `String(...)`. Se añade siempre la clave `tipo` para
 * que la app cliente pueda decidir la pantalla de destino (deep-link) sin necesidad de
 * abrir la notificación primero.
 * @param opciones opciones de envío del push.
 * @returns objeto plano `Record<string, string>` apto para `data` en FCM.
 */
function payloadDatos(opciones: OpcionesPush): Record<string, string> {
  const salida: Record<string, string> = { tipo: opciones.tipo };
  for (const [clave, valor] of Object.entries(opciones.datos ?? {})) {
    // Se omiten explícitamente `undefined`/`null` porque `String(null)` y
    // `String(undefined)` producirían las cadenas literales "null"/"undefined".
    if (valor !== undefined && valor !== null) salida[clave] = String(valor);
  }
  return salida;
}

// Devuelve el messageId del primer envío exitoso (para guardarlo en el log), o undefined.
/**
 * Envía una notificación push a todos los dispositivos registrados de un usuario
 * mediante Firebase Cloud Messaging. La función es completamente best-effort: nunca
 * lanza excepciones, y cualquier fallo (sin tokens, sin proyecto Firebase configurado,
 * error de red, etc.) se traduce en `undefined`.
 * @param opciones datos del push a enviar (destinatario, tipo, título, cuerpo, datos extra).
 * @returns el `messageId` del primer envío exitoso (para registrarlo en el log de
 *   notificaciones), o `undefined` si no se pudo enviar a ningún dispositivo.
 */
export async function enviarPush(opciones: OpcionesPush): Promise<string | undefined> {
  try {
    // Sin tokens registrados no hay nada que enviar: se evita cargar firebase-admin.
    const tokens = await repositorioTokens.tokensDe(opciones.destinatarioId);
    if (tokens.length === 0) return undefined;

    const admin = await obtenerAdmin();
    if (!admin) return undefined;

    // Envío multicast: un único mensaje a todos los dispositivos del usuario.
    const respuesta = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: opciones.titulo, body: opciones.cuerpo },
      data: payloadDatos(opciones),
      android: { priority: 'high' },
    });

    // Limpieza best-effort de tokens caducados/no registrados.
    // FCM informa por cada token individual si el envío falló porque el token ya no es
    // válido (app desinstalada, token rotado, etc.); en ese caso se elimina de Mongo
    // para no seguir intentando enviar a dispositivos inexistentes.
    respuesta.responses.forEach((r: any, i: number) => {
      const codigo = r.error?.code;
      if (
        codigo === 'messaging/registration-token-not-registered' ||
        codigo === 'messaging/invalid-registration-token'
      ) {
        void repositorioTokens.eliminar(tokens[i]).catch(() => undefined);
      }
    });

    // Se devuelve el messageId del primer envío exitoso (basta uno para trazabilidad,
    // aunque el push se haya enviado a varios dispositivos del mismo usuario).
    return respuesta.responses.find((r: any) => r.success)?.messageId;
  } catch (error) {
    // Cualquier error inesperado (red, configuración, etc.) se registra como warning
    // y se ignora: el push nunca debe interrumpir el flujo de negocio que lo originó.
    registrador.warn({ err: error }, '[fcm] error enviando push (ignorado)');
    return undefined;
  }
}
