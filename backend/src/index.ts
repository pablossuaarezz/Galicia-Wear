// JUSTIFICACIÓN: punto de entrada. Solo arranca el servidor HTTP y maneja señales de cierre.
// Toda la lógica vive en `app.ts` para poder testearla sin abrir puertos.
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`[GaliciaWear] API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Cierre limpio (útil en contenedores y para no perder conexiones en hot-reload)
const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.info(`[GaliciaWear] Señal ${signal} recibida, cerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
