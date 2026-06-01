// JUSTIFICACIÓN: wrapper fire-and-forget para escritura de logs en MongoDB.
// Si Mongo no está disponible, el log falla silenciosamente sin afectar la operación
// principal. Así la BBDD NoSQL es un complemento, nunca un punto crítico de fallo.
import { ActividadLog } from '../modulos/mongo';
import { registrador } from './registrador';

interface DatosActividad {
  usuarioId?: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalles?: Record<string, unknown>;
  ipOrigen?: string;
  agenteUsuario?: string;
}

export function registrarActividad(datos: DatosActividad): void {
  ActividadLog.create(datos).catch((err: Error) => {
    registrador.warn({ err }, '[auditoria] No se pudo escribir el log de actividad');
  });
}
