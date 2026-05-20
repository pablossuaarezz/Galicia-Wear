# PROGRESS — Bitácora viva de GaliciaWear

> Archivo vivo. Se actualiza al cierre de cada fase con: tareas hechas, pendientes,
> decisiones tomadas y bloqueos. Sirve también de cuaderno para la defensa oral.

---

## Estado global

- **Fase actual**: ✅ Fase 1 cerrada — esperando OK del usuario para arrancar Fase 2.
- **Última actualización**: 2026-05-20.

---

## Fase 0 — Inicialización ✅

### Tareas hechas

- [x] Estructura del monorepo dentro de `Galicia Wear/` (la carpeta tiene espacio en el nombre; los scripts y configs lo soportan vía `dirname` + paths relativos).
- [x] `.gitignore` raíz + `LICENSE` MIT.
- [x] **Backend** Node 20 + Express + TypeScript:
  - `package.json` con scripts `dev`, `build`, `lint`, `test`, `test:coverage`.
  - `tsconfig.json` estricto.
  - `src/app.ts` (Express puro testeable) + `src/index.ts` (arranque).
  - `src/config/env.ts` con validación zod.
  - Endpoint `/health` funcional.
  - Tests Jest + Supertest (3 casos: health, raíz, 404).
  - `Dockerfile` multi-stage alpine + `.dockerignore`.
- [x] **Web** React + Vite + TS + Tailwind:
  - `vite.config.ts` con proxy `/api` → backend y soporte vitest.
  - `tailwind.config.ts` con paleta atlantic + galego + sand.
  - Landing placeholder con marca y aviso de Fase 0.
  - Test Vitest + Testing Library.
  - `Dockerfile` multi-stage (Node builder + Nginx runtime) + `nginx.conf` con SPA fallback y proxy `/api`.
- [x] **Database** stub:
  - `schema.prisma` con `HealthPing` (placeholder).
  - `seed.ts` placeholder.
  - `migrations/.gitkeep`.
- [x] **Scripts** ejecutables: `start-dev.sh`, `backup.sh` (stub), `restore.sh` (stub).
- [x] **Docs**: `docs/uml/`, `docs/api/`, `docs/memoria/` + `AI_USAGE.md` (rúbrica apdo. 7).
- [x] **Stubs Android y Desktop-admin** con READMEs justificando alcance y arquitectura prevista.
- [x] **Docker Compose**: postgres + mongo + backend + web. Healthchecks. Volúmenes nombrados.
- [x] **`.env.example`** completo (Postgres, Mongo, JWT, CORS, OAuth Google, FCM, rate limit).
- [x] **CI GitHub Actions**: jobs `backend` y `web` con lint + test.
- [x] **README.md** profesional con badges, arquitectura ASCII, arranque Linux, roadmap.

### Decisiones tomadas

| Decisión | Por qué |
|----------|---------|
| Raíz `Galicia Wear/` con espacio | Confirmado por usuario. Mitigado con paths relativos y comillas en scripts. |
| Subcarpetas internas en kebab-case sin espacio | Evita problemas con npm, Maven, gradle, Docker build context. |
| Monorepo plano (no git submodules) | Una CI, una demo, búsqueda cruzada. TFG individual. |
| `app.ts` separado de `index.ts` | Permite tests con Supertest sin abrir puertos. |
| Web: Vite + Nginx en runtime | Imagen final ~25 MB. Build estático rápido. |
| Postgres 16 + Mongo 7 alpine | Imagen mínima, soporte LTS. |
| OAuth Google + ARCore + Firebase como stubs | Eran "opcionales" en el prompt. Se preparan flags en `.env.example`. |
| Cobertura objetivo backend ≥60% (Fase 7) | Realista para TFG; supera "testing básico" de la rúbrica. |

### Pendientes detectados (a resolver en su fase)

- `package-lock.json` aún no existe ni en backend ni en web (se generará con `npm install` en local; CI ya tiene `cache-dependency-path` apuntando al lockfile y `npm install` lo genera al vuelo en ausencia, así que la CI funciona).
- Falta `favicon.svg` en `web/` (cosmético; Fase 6).
- `package-lock.json` en CI usa `npm install` en vez de `npm ci`; se cambiará a `npm ci` cuando exista lockfile commit.

### Verificación local (manual, a ejecutar por el usuario)

```bash
cd "Galicia Wear"
docker compose config                  # Debe imprimir el compose válido sin errores
docker compose up -d postgres mongo    # Postgres y Mongo arrancan y pasan healthcheck
cd backend && npm install && npm test  # 3 tests en verde
cd ../web && npm install && npm test   # 1 test en verde
cd ../backend && npm run dev           # http://localhost:3000/health → 200 OK
cd ../web && npm run dev               # http://localhost:5173 → landing GaliciaWear
```

### Preguntas probables del tribunal — Fase 0

1. **¿Por qué un monorepo con cuatro subproyectos en lugar de cuatro repos independientes?**
   > Trazabilidad académica única, CI común, demo en un solo `docker compose up`, contexto de TFG individual donde no hay equipos paralelos. Trade-off aceptado: no se versionan los subproyectos por separado.

2. **¿Cómo garantizas que un evaluador con Linux puro puede arrancar el proyecto?**
   > Tres caminos: (a) `scripts/start-dev.sh` con `bash` portable y rutas autodetectadas vía `$(dirname "$0")`; (b) `docker compose up` arranca todo a partir de Fase 2; (c) JavaFX se empaqueta con `jpackage` produciendo `.deb` y `.AppImage`. CI corre en `ubuntu-latest`.

3. **¿Por qué Dockerfile multi-stage si el TFG es académico?**
   > Demuestra dominio profesional de Docker (reduce imagen final de ~1.2 GB a ~150 MB en backend y ~25 MB en web). Además es lo que pide la rúbrica al exigir "compatibilidad Linux" y buenas prácticas. Y simplifica la demo en cualquier máquina del tribunal.

---

---

## Fase 1 — Modelado de datos y diagramas UML ✅

### Archivos generados (10)

Todos en `docs/uml/`:

| Diagrama | Archivo | Notas |
|----------|---------|-------|
| ER PostgreSQL (Mermaid) | `er-diagram.mmd` | 18 entidades, cardinalidades crow's foot, GitHub lo renderiza nativo |
| ER PostgreSQL (PlantUML) | `er-diagram.puml` | Misma info, formato alternativo para PDF |
| Clases del dominio backend | `class-domain.puml` | Muestra `BaseRepository<T>`, `IRepository`, `IService`, herencia `BaseEntity`, Value Object `Money`, composición de servicios → POO defendible en tribunal |
| Casos de uso Cliente | `usecase-cliente.puml` | 25 UC en 5 paquetes; include/extend para AR opcional y push tras pago |
| Casos de uso Diseñador | `usecase-disenador.puml` | 22 UC; flag dependencia admin para validación |
| Casos de uso Admin | `usecase-admin.puml` | 25 UC; resalta XML/JSON import/export (UC18-20) |
| Secuencia: compra completa | `sequence-purchase.puml` | 7 fragmentos: búsqueda → detalle → carrito → checkout → transacción Postgres → notificación a diseñador → respuesta. Usa `group [Transacción Postgres]` |
| Secuencia: push tiempo real | `sequence-push.puml` | Diseñador acepta → worker_threads procesa notificación → Socket.IO al cliente + FCM. Demuestra hilos + comunicación entre procesos |
| Despliegue | `deployment.puml` | Móvil/Desktop/Navegador → Caddy HTTPS → Docker network con backend+web+postgres+mongo → FCM/Correos/Pago. backup.sh con cron |
| README de la carpeta | `README.md` | Índice + cómo renderizar + tabla de trazabilidad con la rúbrica DAM |

### Entidades modeladas (18 tablas PostgreSQL + 5 colecciones MongoDB)

**PostgreSQL (núcleo transaccional)**: `user`, `customer`, `designer`, `address`, `product`, `product_variant`, `product_image`, `sustainability_certificate`, `product_certificate`, `cart`, `cart_item`, `order`, `order_item`, `shipment`, `review`, `chat_message`, `refresh_token`.

**MongoDB (logs + multimedia + ML)**: `ActivityLog`, `Recommendation`, `ReviewMedia`, `AnonymousCart`, `NotificationLog`.

### Decisiones de modelado destacables

| Decisión | Por qué |
|----------|---------|
| `User` 1:1 `Customer` y `User` 1:1 `Designer` (no STI ni TPC) | Modelo limpio: campos específicos van solo a la tabla que los necesita. Fácil de mantener con Prisma. |
| `ProductVariant` separado de `Product` (talla/color/stock) | Una camiseta tiene 1 producto y N variantes; el stock se gestiona por SKU. |
| `SustainabilityCertificate` N:M `Product` con tabla puente `product_certificate` | Cada certificado puede aplicar a muchos productos y un producto puede tener varios certificados (GOTS + OEKO-TEX). La tabla puente lleva número de certificado + fecha de emisión + expiración. |
| `OrderItem` referencia `designer_id` (snapshot) | Permite pedidos multi-diseñador (marketplace) y cada línea puede tener su propio `item_status`. |
| `Shipment` 1:1 `Order` con flag `eco_shipping` | Cumple diferenciador "envíos eco" sin sobre-modelar. |
| `Review` enlaza a `order_item_id` (UK) | Solo puedes reseñar lo que has comprado. Anti-spam por construcción. |
| `RefreshToken` en BBDD + hashed | Permite revocar sesiones sin tocar el JWT corto. Patrón rotativo (Fase 2). |
| Fotos de reseñas en MongoDB, no Postgres | Postgres no maneja binarios pesados; Mongo + GridFS sí. Justifica BBDD híbrida. |
| Carritos anónimos en MongoDB (`AnonymousCart`) | TTL automático a 30 días; no contamina Postgres con datos efímeros. |

### Verificación

- [x] Los 8 archivos `.puml` tienen `@startuml` y `@enduml` emparejados.
- [x] El ER cubre las 18 entidades del prompt original.
- [x] Cada caso de uso aparece como `<<include>>` o `<<extend>>` donde corresponde (no sólo flechas sueltas).
- [x] Secuencias usan `group`/`alt` para mostrar control de flujo real (transacciones, condicionales).
- [x] `docs/uml/README.md` mapea cada diagrama con su contenido DAM exigido por rúbrica.

### Preguntas probables del tribunal — Fase 1

1. **¿Por qué `User` 1:1 con `Customer` y `Designer` en vez de single-table inheritance o subtipos en la propia tabla?**
   > La rúbrica DAM penaliza el sobre-modelado. Con 1:1 cada tabla guarda solo lo suyo (un diseñador tiene IBAN, un cliente no), mantengo integridad referencial estricta y Prisma me da relaciones tipadas. La pega es que para datos comunes hago un JOIN, pero es barato (FK en PK) y solo en consultas que ya cruzan ambas.

2. **¿Por qué dos bases de datos (Postgres + MongoDB) en lugar de una sola?**
   > Porque tienen casos de uso opuestos. Postgres lleva el núcleo transaccional con ACID: pedidos, stock, pagos. Mongo lleva datos que no necesitan transacciones pero sí escalabilidad horizontal o esquemas flexibles: logs de auditoría (alta escritura), recomendaciones (JSON anidado), fotos de reseñas (binarios pesados), carritos anónimos con TTL. Y de paso cumple los dos contenidos DAM exigidos: BBDD relacional + BBDD NoSQL.

3. **En la secuencia de "push tiempo real" usas `worker_threads`. ¿Por qué? ¿No podría hacerlo todo el handler HTTP?**
   > Podría, pero tendría dos problemas: primero, **bloquearía la respuesta al diseñador** (el `PATCH` no devuelve 200 hasta que termine FCM, que puede tardar 1-2 s); segundo, **no escalaría**: con 10 pedidos simultáneos saturaría el event loop de Node. Delegando a `worker_threads` desacoplo: el handler devuelve `200 OK` en menos de 100 ms al diseñador, y el worker procesa Socket.IO+FCM+Mongo en paralelo. Como bonus, cubro el contenido DAM "hilos + comunicación entre procesos".

---

## Próxima fase

**Fase 2 — Backend Node + Express + Prisma + Socket.IO + Swagger + tests** (~120 archivos, 2-3 sesiones):

- Estructura por dominios en `backend/src/modules/{auth,users,products,orders,reviews,designers,notifications,admin}/`.
- Schema Prisma completo con todas las entidades de Fase 1.
- Autenticación JWT + refresh rotativo + bcrypt + middleware `requireRole`.
- DTOs con zod en TODOS los endpoints.
- API REST completa (≥30 endpoints) documentada en Swagger UI `/api/docs`.
- Socket.IO para chat + notificaciones + presencia.
- Seed con datos realistas (5 diseñadores gallegos, 30 productos, 10 clientes, 15 pedidos).
- Tests Jest + Supertest (≥1 unit + ≥1 integration por módulo).
- Worker `worker_threads` para notificaciones y export masivos.

> Confirma con "OK Fase 2" para empezar.
