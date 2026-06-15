// JUSTIFICACIÓN: validación de variables de entorno con zod en arranque.
// Falla rápido si falta una variable crítica → evita errores silenciosos en producción.
// Las CLAVES de las variables se mantienen en el estándar Node (`NODE_ENV`, `PORT`,
// `DATABASE_URL`, …) porque herramientas externas (Docker, hosting, Vercel/Railway) las leen
// por ese nombre. El alias que usamos en código sí va en castellano: `entorno.PUERTO`.
import { z } from 'zod';
import dotenv from 'dotenv';

// Carga las variables definidas en el archivo `.env` (si existe) en `process.env`,
// para que estén disponibles antes de validar el esquema.
dotenv.config();

/**
 * Esquema de validación (zod) de todas las variables de entorno que necesita el backend.
 *
 * Cada campo define su tipo, restricciones (mínimos, formatos, enumeraciones) y, en la
 * mayoría de los casos, un valor por defecto pensado para desarrollo local. Validar el
 * entorno al arrancar permite detectar configuraciones incorrectas o incompletas de
 * forma inmediata (fail-fast) en lugar de obtener errores difíciles de depurar en
 * tiempo de ejecución.
 */
const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://galiciawear:galiciawear_dev@localhost:5432/galiciawear?schema=public'),

  // MongoDB — colecciones: ActivityLog, Recommendation, ReviewMedia, AnonymousCart, NotificationLog
  MONGO_URI: z
    .string()
    .min(10, 'MONGO_URI inválido')
    .default('mongodb://localhost:27017/galiciawear'),

  JWT_SECRET: z.string().min(16).default('secreto-de-desarrollo-cambia-en-produccion'),
  JWT_REFRESH_SECRET: z.string().min(16).default('otro-secreto-distinto-cambia-tambien'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  // 1000 peticiones / 15 min por IP: holgado para un SPA (catálogo, sondeo, subidas) pero
  // sigue cortando abuso. El login tiene su propio límite estricto (LOGIN_RATE_LIMIT_MAX).
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),

  // Clave AES-256-GCM para cifrar IBANs (64 chars hex = 32 bytes).
  // CAMBIAR en producción: openssl rand -hex 32
  IBAN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'IBAN_ENCRYPTION_KEY debe ser exactamente 64 caracteres hexadecimales')
    .default('0000000000000000000000000000000000000000000000000000000000000000'),

  // Push FCM (OPCIONAL): ruta al JSON de service account de Firebase Admin. Si no se define,
  // el envío de push se omite silenciosamente (in-app + Socket.IO siguen funcionando).
  // El push real exige además un google-services.json real en la app (hoy es un stub).
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
});

/** Tipo TypeScript inferido automáticamente a partir del esquema zod anterior. */
export type Entorno = z.infer<typeof esquemaEntorno>;

/**
 * Configuración de entorno validada y con tipos, lista para usar en toda la aplicación.
 *
 * `esquemaEntorno.parse(process.env)` lanza una excepción si alguna variable obligatoria
 * falta o no cumple el formato esperado, deteniendo el arranque del proceso de forma
 * inmediata (fail-fast) en lugar de propagar un error más adelante en tiempo de ejecución.
 */
export const entorno: Entorno = esquemaEntorno.parse(process.env);

// Atajos semánticos en castellano para uso interno: evitan comparaciones repetidas
// de cadenas (`entorno.NODE_ENV === '...'`) repartidas por todo el código.
/** `true` si el backend se ejecuta en el entorno de producción. */
export const esProduccion = entorno.NODE_ENV === 'production';
/** `true` si el backend se ejecuta en el entorno de desarrollo local. */
export const esDesarrollo = entorno.NODE_ENV === 'development';
/** `true` si el backend se ejecuta durante la ejecución de tests automatizados. */
export const esPruebas = entorno.NODE_ENV === 'test';
