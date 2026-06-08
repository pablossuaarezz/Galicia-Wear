// Cliente HTTP tipado sobre fetch. Responsabilidades:
//  - Base /api y serialización JSON.
//  - Inyección de `Authorization: Bearer <tokenAcceso>`.
//  - Refresh-on-401 con cola de una sola renovación concurrente (single-flight), replicando
//    el InterceptorJwt de Android y el ClienteHttp del panel JavaFX.
//  - Errores tipados (ErrorApi) con codigo/mensaje del backend.
// Almacenamiento de tokens: el de acceso vive en memoria (no en disco, menor superficie XSS);
// el de refresco se persiste en localStorage para mantener la sesión entre recargas. La
// contrapartida (un XSS podría leer el refresh) se mitiga saneando todo el HTML que se pinta
// y no inyectando nunca HTML de terceros.
import { CLAVE_TOKEN_REFRESCO } from '@/util/constantes';
import type { RespuestaTokens } from './tipos';

export const BASE_API = '/api';

export class ErrorApi extends Error {
  readonly estado: number;
  readonly codigo: string;
  readonly detalles?: unknown;

  constructor(estado: number, codigo: string, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

// ---- Estado de sesión a nivel de módulo ----

let tokenAcceso: string | null = null;
const oyentesCierreForzado = new Set<() => void>();

export function establecerSesion(tokens: RespuestaTokens): void {
  tokenAcceso = tokens.tokenAcceso;
  try {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, tokens.tokenRefresco);
  } catch {
    /* localStorage puede no estar disponible (modo privado); la sesión seguirá en memoria. */
  }
}

export function limpiarSesion(): void {
  tokenAcceso = null;
  try {
    localStorage.removeItem(CLAVE_TOKEN_REFRESCO);
  } catch {
    /* ignorar */
  }
}

export function obtenerTokenRefresco(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN_REFRESCO);
  } catch {
    return null;
  }
}

export function hayTokenRefresco(): boolean {
  return Boolean(obtenerTokenRefresco());
}

/** Permite a ContextoSesion reaccionar cuando el refresco falla (cierre forzado). */
export function registrarCierreForzado(callback: () => void): () => void {
  oyentesCierreForzado.add(callback);
  return () => oyentesCierreForzado.delete(callback);
}

function notificarCierreForzado(): void {
  limpiarSesion();
  oyentesCierreForzado.forEach((cb) => cb());
}

// ---- Refresco de token (single-flight) ----

let promesaRefresco: Promise<boolean> | null = null;

async function refrescarToken(): Promise<boolean> {
  // Si ya hay un refresco en curso, reutiliza su promesa (evita renovaciones en paralelo).
  if (promesaRefresco) return promesaRefresco;

  promesaRefresco = (async () => {
    const refresco = obtenerTokenRefresco();
    if (!refresco) return false;
    try {
      const respuesta = await fetch(`${BASE_API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenRefresco: refresco }),
      });
      if (!respuesta.ok) return false;
      const tokens = (await respuesta.json()) as RespuestaTokens;
      establecerSesion(tokens);
      return true;
    } catch {
      return false;
    } finally {
      promesaRefresco = null;
    }
  })();

  return promesaRefresco;
}

// ---- Construcción de la petición ----

export type ValorParametro = string | number | boolean | undefined | null;

export interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  params?: Record<string, ValorParametro>;
  /** Si es false, no adjunta token ni intenta refrescar (endpoints públicos de auth). */
  autenticar?: boolean;
  senal?: AbortSignal;
}

function construirUrl(ruta: string, params?: Record<string, ValorParametro>): string {
  const url = `${BASE_API}${ruta}`;
  if (!params) return url;
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      consulta.append(clave, String(valor));
    }
  }
  const cadena = consulta.toString();
  return cadena ? `${url}?${cadena}` : url;
}

async function ejecutar(ruta: string, opciones: OpcionesPeticion): Promise<Response> {
  const cabeceras: Record<string, string> = {};
  if (opciones.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (opciones.autenticar !== false && tokenAcceso) {
    cabeceras.Authorization = `Bearer ${tokenAcceso}`;
  }
  return fetch(construirUrl(ruta, opciones.params), {
    method: opciones.metodo ?? 'GET',
    headers: cabeceras,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    signal: opciones.senal,
  });
}

async function interpretarError(respuesta: Response): Promise<never> {
  let codigo = 'ERROR';
  let mensaje = `Error ${respuesta.status}`;
  let detalles: unknown;
  try {
    const cuerpo = await respuesta.json();
    if (cuerpo && typeof cuerpo === 'object') {
      if (typeof cuerpo.error === 'string') mensaje = cuerpo.error;
      if (typeof cuerpo.codigo === 'string') codigo = cuerpo.codigo;
      detalles = cuerpo.detalles;
    }
  } catch {
    /* el cuerpo no era JSON; se mantiene el mensaje por defecto */
  }
  throw new ErrorApi(respuesta.status, codigo, mensaje, detalles);
}

/**
 * Petición tipada. Devuelve el cuerpo JSON ya parseado como T (o undefined si es 204).
 * El "desenvuelto" de `{ clave: ... }` lo hace cada función de endpoint destructurando T.
 */
export async function solicitar<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await ejecutar(ruta, opciones);
  } catch {
    throw new ErrorApi(0, 'RED', 'No se pudo conectar con el servidor. ¿Está arrancado el backend?');
  }

  // Refresh-on-401: un único reintento tras renovar el token.
  if (
    respuesta.status === 401 &&
    opciones.autenticar !== false &&
    hayTokenRefresco()
  ) {
    const renovado = await refrescarToken();
    if (renovado) {
      try {
        respuesta = await ejecutar(ruta, opciones);
      } catch {
        throw new ErrorApi(0, 'RED', 'No se pudo conectar con el servidor.');
      }
    } else {
      notificarCierreForzado();
    }
  }

  if (!respuesta.ok) await interpretarError(respuesta);

  if (respuesta.status === 204) return undefined as T;
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
