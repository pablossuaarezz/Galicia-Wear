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

/** Prefijo común de todas las rutas de la API REST (proxy a /api en el backend). */
export const BASE_API = '/api';

/**
 * Error tipado que representa una respuesta de error de la API o un fallo de red.
 * Encapsula el código HTTP (`estado`), un código simbólico del backend (`codigo`),
 * un mensaje legible (heredado de `Error.message`) y detalles adicionales opcionales
 * (por ejemplo, errores de validación campo a campo).
 */
export class ErrorApi extends Error {
  /** Código de estado HTTP de la respuesta (0 si fue un error de red, sin respuesta). */
  readonly estado: number;
  /** Código simbólico devuelto por el backend (p. ej. "NO_ENCONTRADO", "RED"). */
  readonly codigo: string;
  /** Información adicional del error (opcional), p. ej. detalles de validación. */
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

// Token de acceso (JWT de corta duración) guardado solo en memoria: se pierde al recargar
// la página, lo que reduce la superficie de ataque XSS (no es legible desde localStorage).
let tokenAcceso: string | null = null;
// Conjunto de callbacks que ContextoSesion registra para reaccionar cuando se fuerza
// el cierre de sesión (p. ej. el refresco del token ha fallado definitivamente).
const oyentesCierreForzado = new Set<() => void>();

/**
 * Guarda en el cliente los tokens devueltos por el backend tras login/registro/refresco.
 * El token de acceso se mantiene en memoria; el de refresco se persiste en localStorage
 * para poder restaurar la sesión entre recargas de página.
 * @param tokens Respuesta de tokens del backend (tokenAcceso, tokenRefresco, etc.).
 */
export function establecerSesion(tokens: RespuestaTokens): void {
  tokenAcceso = tokens.tokenAcceso;
  try {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, tokens.tokenRefresco);
  } catch {
    /* localStorage puede no estar disponible (modo privado); la sesión seguirá en memoria. */
  }
}

/**
 * Elimina la sesión actual: borra el token de acceso en memoria y el token de
 * refresco persistido en localStorage. Se usa al cerrar sesión (logout) o tras
 * un cierre forzado por fallo de refresco.
 */
export function limpiarSesion(): void {
  tokenAcceso = null;
  try {
    localStorage.removeItem(CLAVE_TOKEN_REFRESCO);
  } catch {
    /* ignorar */
  }
}

/**
 * Lee el token de refresco persistido en localStorage.
 * @returns El token de refresco o `null` si no existe o localStorage no está disponible.
 */
export function obtenerTokenRefresco(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN_REFRESCO);
  } catch {
    return null;
  }
}

/** Token de acceso vigente (en memoria). Lo usa el cliente de Socket.IO para el handshake. */
export function obtenerTokenAcceso(): string | null {
  return tokenAcceso;
}

/**
 * Indica si existe un token de refresco persistido (es decir, si hay una sesión
 * recuperable tras recargar la página).
 * @returns `true` si hay token de refresco disponible.
 */
export function hayTokenRefresco(): boolean {
  return Boolean(obtenerTokenRefresco());
}

/**
 * Permite a ContextoSesion reaccionar cuando el refresco falla (cierre forzado).
 * @param callback Función a invocar cuando se produce un cierre de sesión forzado.
 * @returns Función de cancelación que elimina el callback del conjunto de oyentes.
 */
export function registrarCierreForzado(callback: () => void): () => void {
  oyentesCierreForzado.add(callback);
  return () => oyentesCierreForzado.delete(callback);
}

/**
 * Limpia la sesión local y avisa a todos los oyentes registrados (ContextoSesion)
 * de que la sesión se ha cerrado de forma forzada, normalmente porque el refresco
 * del token de acceso ha fallado (el token de refresco ha caducado o es inválido).
 */
function notificarCierreForzado(): void {
  limpiarSesion();
  oyentesCierreForzado.forEach((cb) => cb());
}

// ---- Refresco de token (single-flight) ----

// Promesa compartida del refresco en curso. Permite el patrón "single-flight": si varias
// peticiones reciben un 401 a la vez, solo una llamará a /auth/refresh y el resto esperará
// el resultado de esa misma promesa, evitando renovaciones de token duplicadas/concurrentes.
let promesaRefresco: Promise<boolean> | null = null;

/**
 * Intenta renovar el token de acceso llamando a POST /auth/refresh con el token
 * de refresco almacenado. Implementa single-flight: si ya hay un refresco en curso,
 * devuelve esa misma promesa en lugar de iniciar otra petición.
 * @returns `true` si el refresco tuvo éxito (la sesión queda actualizada), `false` en caso contrario.
 */
async function refrescarToken(): Promise<boolean> {
  // Si ya hay un refresco en curso, reutiliza su promesa (evita renovaciones en paralelo).
  if (promesaRefresco) return promesaRefresco;

  promesaRefresco = (async () => {
    const refresco = obtenerTokenRefresco();
    if (!refresco) return false;
    try {
      // Llamada a POST /auth/refresh: petición pública, no requiere Authorization.
      const respuesta = await fetch(`${BASE_API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenRefresco: refresco }),
      });
      if (!respuesta.ok) return false;
      const tokens = (await respuesta.json()) as RespuestaTokens;
      // Guarda los nuevos tokens (acceso en memoria, refresco en localStorage).
      establecerSesion(tokens);
      return true;
    } catch {
      return false;
    } finally {
      // Libera la promesa compartida tanto si tuvo éxito como si falló, para que
      // futuros 401 puedan disparar un nuevo intento de refresco.
      promesaRefresco = null;
    }
  })();

  return promesaRefresco;
}

// ---- Construcción de la petición ----

/** Tipos de valor admitidos para parámetros de consulta (query string). */
export type ValorParametro = string | number | boolean | undefined | null;

/** Opciones aceptadas por `solicitar` para configurar una petición HTTP. */
export interface OpcionesPeticion {
  /** Método HTTP; por defecto 'GET'. */
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Cuerpo de la petición; se serializa automáticamente como JSON. */
  cuerpo?: unknown;
  /** Parámetros de consulta (query string); los valores undefined/null/'' se omiten. */
  params?: Record<string, ValorParametro>;
  /** Si es false, no adjunta token ni intenta refrescar (endpoints públicos de auth). */
  autenticar?: boolean;
  /** Señal de cancelación (AbortController) para abortar la petición fetch. */
  senal?: AbortSignal;
}

/**
 * Construye la URL final de una petición a partir de la ruta relativa y los parámetros
 * de consulta opcionales. Los valores `undefined`, `null` o cadena vacía se omiten.
 * @param ruta Ruta relativa a BASE_API (p. ej. "/productos").
 * @param params Parámetros de consulta a añadir como query string.
 * @returns URL completa, con `?...` si hay parámetros válidos.
 */
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

/**
 * Ejecuta la petición fetch subyacente: construye las cabeceras (Content-Type y
 * Authorization según corresponda) y la URL final, y delega en `fetch`.
 * @param ruta Ruta relativa a BASE_API.
 * @param opciones Opciones de la petición (método, cuerpo, params, autenticar, senal).
 * @returns La `Response` cruda de fetch (sin interpretar todavía).
 */
async function ejecutar(ruta: string, opciones: OpcionesPeticion): Promise<Response> {
  const cabeceras: Record<string, string> = {};
  if (opciones.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  // Adjunta el token de acceso salvo que la petición sea explícitamente no autenticada
  // (p. ej. login/registro) o no haya sesión activa.
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

/**
 * Convierte una respuesta HTTP no exitosa (status fuera del rango 2xx) en un
 * `ErrorApi`, intentando extraer del cuerpo JSON el mensaje, código y detalles
 * que devuelve el backend. Si el cuerpo no es JSON válido, usa valores por defecto.
 * @param respuesta Respuesta HTTP con `ok === false`.
 * @throws {ErrorApi} Siempre lanza; el tipo de retorno `never` refleja esto.
 */
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
    // fetch lanza si hay un error de red (servidor caído, sin conexión, CORS, etc.).
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
      // El token de acceso se renovó correctamente: repite la petición original
      // (ahora `ejecutar` adjuntará el nuevo Authorization desde `tokenAcceso`).
      try {
        respuesta = await ejecutar(ruta, opciones);
      } catch {
        throw new ErrorApi(0, 'RED', 'No se pudo conectar con el servidor.');
      }
    } else {
      // El refresco falló (token de refresco caducado/inválido): se fuerza el
      // cierre de sesión y se notifica a ContextoSesion. La petición original
      // continúa y devolverá el 401 original al interpretarse como error.
      notificarCierreForzado();
    }
  }

  if (!respuesta.ok) await interpretarError(respuesta);

  // Las respuestas 204 No Content no tienen cuerpo: se devuelve undefined.
  if (respuesta.status === 204) return undefined as T;
  // Algunos endpoints devuelven cuerpo vacío con status 200; se evita JSON.parse('').
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
