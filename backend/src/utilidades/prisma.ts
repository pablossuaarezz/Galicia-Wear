// JUSTIFICACIÓN: una sola instancia compartida de PrismaClient → evita agotar el pool de
// conexiones de Postgres. En tests usamos una BBDD distinta; ver tests/setup.ts (Fase 2e).
import { PrismaClient } from '@prisma/client';
import { entorno, esPruebas } from '../configuracion/entorno';
import { registrador } from './registrador';

/**
 * Instancia única (singleton) de `PrismaClient`, compartida por toda la aplicación.
 *
 * En tests (`esPruebas`) se desactiva el log de queries para no ensuciar la salida,
 * y se mantiene la conexión apuntando a `entorno.DATABASE_URL` (que en el entorno
 * de test se configura hacia una base de datos distinta, ver `tests/setup.ts`).
 */
export const prisma = new PrismaClient({
  log: esPruebas ? [] : [{ emit: 'event', level: 'query' }, 'warn', 'error'],
  datasourceUrl: entorno.DATABASE_URL,
});

// Log opcional de queries lentas en desarrollo: ayuda a detectar problemas de
// rendimiento (N+1, falta de índices) sin necesidad de herramientas externas.
if (!esPruebas) {
  // @ts-expect-error — Prisma tipa el evento por nombre
  prisma.$on('query', (evento: { duration: number; query: string }) => {
    // Solo se registran las queries que tardan más de 200ms, para no generar
    // ruido con las consultas rápidas (la mayoría).
    if (evento.duration > 200) {
      registrador.warn({ duracionMs: evento.duration, query: evento.query }, 'Query lenta');
    }
  });
}

/**
 * Cierra la conexión del cliente Prisma con la base de datos Postgres.
 * Se invoca durante el apagado ordenado del servidor (`index.ts`).
 */
export async function cerrarConexionBd(): Promise<void> {
  await prisma.$disconnect();
}
