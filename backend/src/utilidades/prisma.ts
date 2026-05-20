// JUSTIFICACIÓN: una sola instancia compartida de PrismaClient → evita agotar el pool de
// conexiones de Postgres. En tests usamos una BBDD distinta; ver tests/setup.ts (Fase 2e).
import { PrismaClient } from '@prisma/client';
import { entorno, esPruebas } from '../configuracion/entorno';
import { registrador } from './registrador';

export const prisma = new PrismaClient({
  log: esPruebas ? [] : [{ emit: 'event', level: 'query' }, 'warn', 'error'],
  datasourceUrl: entorno.DATABASE_URL,
});

// Log opcional de queries lentas en desarrollo
if (!esPruebas) {
  // @ts-expect-error — Prisma tipa el evento por nombre
  prisma.$on('query', (evento: { duration: number; query: string }) => {
    if (evento.duration > 200) {
      registrador.warn({ duracionMs: evento.duration, query: evento.query }, 'Query lenta');
    }
  });
}

export async function cerrarConexionBd(): Promise<void> {
  await prisma.$disconnect();
}
