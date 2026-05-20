// JUSTIFICACIÓN: separar `app` (Express puro, testeable con Supertest) de `index.ts` (arranque).
// Esto permite tests de integración sin abrir puertos reales.
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';

export function createApp(): Application {
  const app = express();

  // Seguridad: cabeceras HTTP estándar (CSP, XSS, HSTS, ...)
  app.use(helmet());

  // CORS controlado por variable de entorno (el web cliente vive en otro origen)
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logger HTTP estructurado (JSON) — base para auditoría en Fase 3
  app.use(pinoHttp({ level: env.LOG_LEVEL }));

  // Healthcheck público — usado por Docker Compose y monitorización
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'galiciawear-backend',
      version: '0.1.0',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      message: 'GaliciaWear API — moda sostenible gallega',
      docs: '/api/docs (disponible a partir de la Fase 2)',
    });
  });

  // 404 controlado
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Handler de errores global (con tipos correctos para que TS no se queje)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const log = (res.req as Request & { log?: { error: (e: unknown, msg: string) => void } }).log;
    log?.error(err, 'Unhandled error');
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
