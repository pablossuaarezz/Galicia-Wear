// JUSTIFICACIÓN: singleton de conexión Mongoose. Evita abrir múltiples conexiones
// si el módulo se importa varias veces. Cumple "BBDD NoSQL" de la rúbrica DAM.
import mongoose from 'mongoose';
import { entorno } from '../configuracion/entorno';
import { registrador } from './registrador';

type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';
let estado: EstadoConexion = 'desconectado';

export async function conectarMongo(): Promise<void> {
  if (estado === 'conectado') return;
  if (estado === 'conectando') {
    await new Promise<void>((resolve) => mongoose.connection.once('connected', resolve));
    return;
  }

  estado = 'conectando';

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

  await mongoose.connect(entorno.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  });
}

export async function cerrarConexionMongo(): Promise<void> {
  if (estado !== 'conectado') return;
  await mongoose.disconnect();
  estado = 'desconectado';
}
