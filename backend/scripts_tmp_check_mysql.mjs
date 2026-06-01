import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const tablas = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME as nombre FROM information_schema.tables WHERE table_schema = 'psuarez' ORDER BY TABLE_NAME"
  );
  console.log('Tablas en psuarez:', JSON.stringify(tablas));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
