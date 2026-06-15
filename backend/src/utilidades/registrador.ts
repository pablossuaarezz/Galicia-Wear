// JUSTIFICACIÓN: logger estructurado con pino. Salida JSON en producción (parseable por
// agregadores tipo Loki/Datadog); pretty-print en desarrollo para legibilidad humana.
import pino from 'pino';
import { entorno, esDesarrollo } from '../configuracion/entorno';

/**
 * Logger global de la aplicación (instancia de pino), usado por todos los módulos
 * para registrar eventos, advertencias y errores de forma estructurada.
 *
 * - El nivel mínimo de log (`level`) se controla mediante la variable de entorno `LOG_LEVEL`.
 * - En desarrollo (`esDesarrollo`), se usa `pino-pretty` para imprimir los logs con
 *   colores y timestamps legibles por humanos en la consola.
 * - En el resto de entornos (producción/test), se omite el `transport` y pino
 *   produce líneas JSON, fáciles de procesar por agregadores de logs externos.
 * - Todos los logs incluyen el campo base `servicio: 'galiciawear-api'`, útil para
 *   filtrar los logs de este servicio en sistemas centralizados.
 */
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
