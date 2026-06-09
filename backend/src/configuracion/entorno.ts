// JUSTIFICACIÓN: validación de variables de entorno con zod en arranque.
// Falla rápido si falta una variable crítica → evita errores silenciosos en producción.
// Las CLAVES de las variables se mantienen en el estándar Node (`NODE_ENV`, `PORT`,
// `DATABASE_URL`, …) porque herramientas externas (Docker, hosting, Vercel/Railway) las leen
// por ese nombre. El alias que usamos en código sí va en castellano: `entorno.PUERTO`.
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

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

export type Entorno = z.infer<typeof esquemaEntorno>;

export const entorno: Entorno = esquemaEntorno.parse(process.env);

// Atajos semánticos en castellano para uso interno
export const esProduccion = entorno.NODE_ENV === 'production';
export const esDesarrollo = entorno.NODE_ENV === 'development';
export const esPruebas = entorno.NODE_ENV === 'test';
