// JUSTIFICACIÓN: logger estructurado con pino. Salida JSON en producción (parseable por
// agregadores tipo Loki/Datadog); pretty-print en desarrollo para legibilidad humana.
import pino from 'pino';
import { entorno, esDesarrollo } from '../configuracion/entorno';

export const registrador = pino({
  level: entorno.LOG_LEVEL,
  transport: esDesarrollo
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
      }
    : undefined,
  base: { servicio: 'galiciawear-api' },
});
