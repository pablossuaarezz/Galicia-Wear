// JUSTIFICACIÓN: stub de Fase 0. En Fase 2 se completa con datos realistas:
//   - 5 diseñadores gallegos ficticios (Lugo, Santiago, Coruña, Vigo, Pontevedra)
//   - 30 productos con certificados GOTS/OEKO-TEX y km de origen
//   - 10 clientes (incluye buyer persona "Ana López")
//   - 15 pedidos en distintos estados
//   - reseñas con fotos (Mongo)
// Ejecución (a partir de Fase 2): `npx tsx database/seed.ts`
async function main() {
  // eslint-disable-next-line no-console
  console.info('[seed] Stub Fase 0 — sin datos hasta Fase 2.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
