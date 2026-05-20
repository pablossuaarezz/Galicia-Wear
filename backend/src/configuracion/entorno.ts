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
  MONGO_URL: z.string().optional(),

  JWT_SECRET: z.string().min(16).default('secreto-de-desarrollo-cambia-en-produccion'),
  JWT_REFRESH_SECRET: z.string().min(16).default('otro-secreto-distinto-cambia-tambien'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

export const entorno: Entorno = esquemaEntorno.parse(process.env);

// Atajos semánticos en castellano para uso interno
export const esProduccion = entorno.NODE_ENV === 'production';
export const esDesarrollo = entorno.NODE_ENV === 'development';
export const esPruebas = entorno.NODE_ENV === 'test';
