// JUSTIFICACIÓN: punto de entrada. Solo arranca el servidor HTTP y maneja señales de cierre.
// Toda la lógica vive en `aplicacion.ts` para poder testearla sin abrir puertos.
//
// Este archivo se encarga de:
//  1. Conectar con MongoDB (de forma tolerante a fallos).
//  2. Construir la app de Express y arrancar el servidor HTTP en el puerto configurado.
//  3. Inicializar el gateway de Socket.IO sobre el mismo servidor HTTP (chat en tiempo real).
//  4. Registrar manejadores de señales del sistema operativo (SIGTERM/SIGINT) para realizar
//     un cierre ordenado de las conexiones (Socket.IO, Postgres, MongoDB) antes de terminar
//     el proceso.
import { crearAplicacion } from './aplicacion';
import { entorno } from './configuracion/entorno';
import { registrador } from './utilidades/registrador';
import { cerrarConexionBd } from './utilidades/prisma';
import { conectarMongo, cerrarConexionMongo } from './utilidades/mongo';
import { inicializarSockets } from './tiempoReal/servidorSockets';

/**
 * Función principal de arranque del backend.
 *
 * Inicializa, en orden, la conexión a MongoDB, el servidor HTTP de Express y el
 * gateway de Socket.IO, y registra los manejadores de señales del sistema para
 * un apagado ordenado (graceful shutdown).
 *
 * No devuelve ningún valor; sus efectos son completamente de E/S (abrir conexiones
 * y puertos, registrar listeners).
 */
async function arrancar(): Promise<void> {
  // Conectar a MongoDB antes de levantar el servidor HTTP.
  // Se captura el error y solo se registra un warning: MongoDB se usa para datos
  // complementarios (logs de actividad, recomendaciones, etc.), por lo que su
  // ausencia no debe impedir que la API REST principal (Postgres) funcione.
  try {
    await conectarMongo();
  } catch (err) {
    registrador.warn({ err }, '[mongo] No se pudo conectar — el backend arranca sin MongoDB');
  }

  const aplicacion = crearAplicacion();

  // Arranca el servidor HTTP escuchando en todas las interfaces (0.0.0.0) para que
  // sea accesible tanto en local como dentro de un contenedor Docker.
  const servidor = aplicacion.listen(entorno.PORT, '0.0.0.0', () => {
    registrador.info(
      { puerto: entorno.PORT, entorno: entorno.NODE_ENV },
      'API GaliciaWear escuchando',
    );
  });

  // Gateway de chat en tiempo real (Socket.IO) enganchado al mismo servidor HTTP,
  // reutilizando el mismo puerto que la API REST.
  const io = inicializarSockets(servidor);

  /**
   * Realiza un apagado ordenado del servidor ante una señal del sistema operativo
   * (SIGTERM o SIGINT, p. ej. al detener un contenedor o pulsar Ctrl+C).
   *
   * Cierra primero las conexiones de Socket.IO, después deja de aceptar nuevas
   * conexiones HTTP y, una vez cerrado el servidor, cierra también las conexiones
   * a Postgres (Prisma) y MongoDB antes de finalizar el proceso con código 0.
   *
   * @param senal nombre de la señal recibida (solo a efectos de logging)
   */
  const apagar = async (senal: string): Promise<void> => {
    registrador.info({ senal }, 'Señal recibida, cerrando servidor...');
    await io.close();
    servidor.close(async () => {
      await cerrarConexionBd();
      await cerrarConexionMongo();
      process.exit(0);
    });
  };

  // `void` descarta la promesa devuelta por `apagar` (no necesitamos esperarla
  // aquí, los listeners de proceso no soportan async directamente).
  process.on('SIGTERM', () => void apagar('SIGTERM'));
  process.on('SIGINT', () => void apagar('SIGINT'));
}

// Si el arranque falla de forma irrecuperable (p. ej. error de configuración),
// se registra el error en consola y se termina el proceso con código de error 1.
arrancar().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error fatal al arrancar:', err);
  process.exit(1);
});
