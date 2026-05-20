// JUSTIFICACIÓN: punto de entrada. Solo arranca el servidor HTTP y maneja señales de cierre.
// Toda la lógica vive en `aplicacion.ts` para poder testearla sin abrir puertos.
import { crearAplicacion } from './aplicacion';
import { entorno } from './configuracion/entorno';
import { registrador } from './utilidades/registrador';
import { cerrarConexionBd } from './utilidades/prisma';

const aplicacion = crearAplicacion();

const servidor = aplicacion.listen(entorno.PORT, () => {
  registrador.info(
    { puerto: entorno.PORT, entorno: entorno.NODE_ENV },
    'API GaliciaWear escuchando',
  );
});

// Cierre limpio (útil en contenedores y para no perder conexiones en hot-reload)
const apagar = async (senal: string): Promise<void> => {
  registrador.info({ senal }, 'Señal recibida, cerrando servidor...');
  servidor.close(async () => {
    await cerrarConexionBd();
    process.exit(0);
  });
};

process.on('SIGTERM', () => void apagar('SIGTERM'));
process.on('SIGINT', () => void apagar('SIGINT'));
