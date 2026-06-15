// JUSTIFICACIÓN: singleton de conexión Mongoose. Evita abrir múltiples conexiones
// si el módulo se importa varias veces. Cumple "BBDD NoSQL" de la rúbrica DAM.
import mongoose from 'mongoose';
import { entorno } from '../configuracion/entorno';
import { registrador } from './registrador';

/** Estados posibles de la conexión a MongoDB gestionados por este módulo. */
type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';
/** Estado actual de la conexión, compartido por todo el proceso (módulo singleton). */
let estado: EstadoConexion = 'desconectado';

/**
 * Establece (o reutiliza) la conexión global a MongoDB mediante Mongoose.
 *
 * Es segura ante llamadas concurrentes/repetidas:
 *  - si ya está conectado, no hace nada y resuelve inmediatamente;
 *  - si ya hay una conexión en curso, espera a que esa conexión termine en lugar
 *    de iniciar una segunda conexión en paralelo;
 *  - en caso contrario, inicia la conexión y registra listeners sobre los eventos
 *    de la conexión para mantener actualizado el estado y dejar constancia en los logs.
 *
 * @returns una promesa que se resuelve cuando la conexión se ha establecido
 * @throws cualquier error lanzado por `mongoose.connect` si la conexión inicial falla
 *         (el llamador, en `index.ts`, lo captura y permite arrancar sin Mongo)
 */
export async function conectarMongo(): Promise<void> {
  if (estado === 'conectado') return;
  if (estado === 'conectando') {
    // Evita conexiones duplicadas si `conectarMongo` se llama varias veces antes
    // de que la primera llamada termine: simplemente esperamos su evento 'connected'.
    await new Promise<void>((resolve) => mongoose.connection.once('connected', resolve));
    return;
  }

  estado = 'conectando';

  // Listeners registrados una sola vez (la primera vez que se llama a esta función)
  // para mantener sincronizado el estado interno con el estado real de la conexión.
  mongoose.connection.on('connected', () => {
    estado = 'conectado';
    registrador.info({ bd: mongoose.connection.name }, '[mongo] Conectado');
  });
  mongoose.connection.on('error', (err: Error) => {
    registrador.error({ err }, '[mongo] Error de conexión');
  });
  mongoose.connection.on('disconnected', () => {
    estado = 'desconectado';
    registrador.warn('[mongo] Desconectado');
  });

  // Timeouts cortos: si Mongo no responde en 5s al seleccionar servidor, se
  // considera fallida la conexión en lugar de bloquear el arranque indefinidamente.
  await mongoose.connect(entorno.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  });
}

/**
 * Cierra la conexión a MongoDB si está activa. Se usa durante el apagado
 * ordenado del servidor (`index.ts`). No hace nada si ya está desconectado.
 */
export async function cerrarConexionMongo(): Promise<void> {
  if (estado !== 'conectado') return;
  await mongoose.disconnect();
  estado = 'desconectado';
}
