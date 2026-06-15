// JUSTIFICACIÓN: wrapper fire-and-forget para escritura de logs en MongoDB.
// Si Mongo no está disponible, el log falla silenciosamente sin afectar la operación
// principal. Así la BBDD NoSQL es un complemento, nunca un punto crítico de fallo.
import { ActividadLog } from '../modulos/mongo';
import { registrador } from './registrador';

/**
 * Estructura de un evento de auditoría/actividad a registrar en MongoDB
 * (colección `ActividadLog`).
 */
interface DatosActividad {
  usuarioId?: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalles?: Record<string, unknown>;
  ipOrigen?: string;
  agenteUsuario?: string;
}

/**
 * Registra un evento de actividad/auditoría en MongoDB de forma asíncrona y
 * "fire-and-forget" (no se espera su resultado).
 *
 * Se usa para trazar acciones relevantes del usuario (login, cambios de datos,
 * acciones administrativas, etc.) sin bloquear ni condicionar el flujo principal
 * de la petición: si la escritura en MongoDB falla (p. ej. Mongo no disponible),
 * solo se registra un warning en el logger y la operación de negocio que invocó
 * esta función continúa con normalidad.
 *
 * @param datos información del evento de actividad a guardar
 */
export function registrarActividad(datos: DatosActividad): void {
  // No se usa `await`: el llamador no debe esperar a que el log se escriba ni
  // debe fallar si MongoDB no está disponible (es un complemento, no algo crítico).
  ActividadLog.create(datos).catch((err: Error) => {
    registrador.warn({ err }, '[auditoria] No se pudo escribir el log de actividad');
  });
}
