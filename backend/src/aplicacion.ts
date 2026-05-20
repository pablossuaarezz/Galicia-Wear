// JUSTIFICACIÓN: separar `aplicacion` (Express puro, testeable con Supertest) de `index.ts`
// (arranque). Esto permite tests de integración sin abrir puertos reales.
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { entorno } from './configuracion/entorno';
import { registrador } from './utilidades/registrador';
import { manejadorErrores } from './middlewares/manejadorErrores';
import { rutasAutenticacion } from './modulos/autenticacion/rutas';

export function crearAplicacion(): Application {
  const aplicacion = express();

  // 1. Seguridad: cabeceras HTTP estándar (CSP, XSS, HSTS, ...)
  aplicacion.use(helmet());

  // 2. CORS controlado por variable de entorno
  aplicacion.use(cors({ origin: entorno.CORS_ORIGIN, credentials: true }));

  // 3. Body parsers
  aplicacion.use(express.json({ limit: '1mb' }));
  aplicacion.use(express.urlencoded({ extended: true }));

  // 4. Logger HTTP estructurado
  aplicacion.use(pinoHttp({ logger: registrador }));

  // 5. Rate limit global (anti DoS básico)
  const limiteGlobal = rateLimit({
    windowMs: entorno.RATE_LIMIT_WINDOW_MS,
    max: entorno.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  aplicacion.use(limiteGlobal);

  // 6. Endpoints públicos
  aplicacion.get('/salud', (_peticion: Request, respuesta: Response) => {
    respuesta.status(200).json({
      estado: 'ok',
      servicio: 'galiciawear-backend',
      version: '0.2.0',
      entorno: entorno.NODE_ENV,
      marcaTiempo: new Date().toISOString(),
    });
  });

  aplicacion.get('/', (_peticion: Request, respuesta: Response) => {
    respuesta.status(200).json({
      mensaje: 'GaliciaWear API — moda sostenible gallega',
      documentacion: '/api/docs (disponible cuando se completen los módulos restantes)',
      version: '0.2.0',
    });
  });

  // 7. Rutas de la API REST
  aplicacion.use('/auth', rutasAutenticacion);

  // 8. 404 controlado para cualquier ruta no definida
  aplicacion.use((_peticion: Request, respuesta: Response) => {
    respuesta.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
  });

  // 9. Handler de errores global (DEBE ir el último)
  aplicacion.use(manejadorErrores);

  return aplicacion;
}
