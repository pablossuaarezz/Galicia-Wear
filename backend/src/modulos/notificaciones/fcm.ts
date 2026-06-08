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
function payloadDatos(opciones: OpcionesPush): Record<string, string> {
  const salida: Record<string, string> = { tipo: opciones.tipo };
  for (const [clave, valor] of Object.entries(opciones.datos ?? {})) {
    if (valor !== undefined && valor !== null) salida[clave] = String(valor);
  }
  return salida;
}

// Devuelve el messageId del primer envío exitoso (para guardarlo en el log), o undefined.
export async function enviarPush(opciones: OpcionesPush): Promise<string | undefined> {
  try {
    const tokens = await repositorioTokens.tokensDe(opciones.destinatarioId);
    if (tokens.length === 0) return undefined;

    const admin = await obtenerAdmin();
    if (!admin) return undefined;

    const respuesta = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: opciones.titulo, body: opciones.cuerpo },
      data: payloadDatos(opciones),
      android: { priority: 'high' },
    });

    // Limpieza best-effort de tokens caducados/no registrados.
    respuesta.responses.forEach((r: any, i: number) => {
      const codigo = r.error?.code;
      if (
        codigo === 'messaging/registration-token-not-registered' ||
        codigo === 'messaging/invalid-registration-token'
      ) {
        void repositorioTokens.eliminar(tokens[i]).catch(() => undefined);
      }
    });

    return respuesta.responses.find((r: any) => r.success)?.messageId;
  } catch (error) {
    registrador.warn({ err: error }, '[fcm] error enviando push (ignorado)');
    return undefined;
  }
}
