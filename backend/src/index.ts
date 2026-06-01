// JUSTIFICACIÓN: punto de entrada. Solo arranca el servidor HTTP y maneja señales de cierre.
// Toda la lógica vive en `aplicacion.ts` para poder testearla sin abrir puertos.
import { crearAplicacion } from './aplicacion';
import { entorno } from './configuracion/entorno';
import { registrador } from './utilidades/registrador';
import { cerrarConexionBd } from './utilidades/prisma';
import { conectarMongo, cerrarConexionMongo } from './utilidades/mongo';

async function arrancar(): Promise<void> {
  // Conectar a MongoDB antes de levantar el servidor HTTP
  try {
    await conectarMongo();
  } catch (err) {
    registrador.warn({ err }, '[mongo] No se pudo conectar — el backend arranca sin MongoDB');
  }

  const aplicacion = crearAplicacion();

  const servidor = aplicacion.listen(entorno.PORT, () => {
    registrador.info(
      { puerto: entorno.PORT, entorno: entorno.NODE_ENV },
      'API GaliciaWear escuchando',
    );
  });

  const apagar = async (senal: string): Promise<void> => {
    registrador.info({ senal }, 'Señal recibida, cerrando servidor...');
    servidor.close(async () => {
      await cerrarConexionBd();
      await cerrarConexionMongo();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void apagar('SIGTERM'));
  process.on('SIGINT', () => void apagar('SIGINT'));
}

arrancar().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error fatal al arrancar:', err);
  process.exit(1);
});
