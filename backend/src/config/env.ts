// JUSTIFICACIÓN: validación de variables de entorno con zod en arranque.
// Falla rápido si falta una variable crítica → evita errores silenciosos en prod.
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  MONGO_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('change-me-please-min-16-chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change-me-too-please-min-16'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
