# PROGRESS — Bitácora viva de GaliciaWear

> Archivo vivo. Se actualiza al cierre de cada fase con: tareas hechas, pendientes,
> decisiones tomadas y bloqueos. Sirve también de cuaderno para la defensa oral.

---

## Estado global

- **Fase actual**: ✅ Fase 6 completa (Sistema de notificaciones extremo a extremo). Fases 0–6 cerradas.
- **Última actualización**: 2026-06-08.
- **Rama**: `main`.
- **Regla activa desde Fase 2**: TODOS los identificadores en castellano. Ver [`CONVENCIONES.md`](./CONVENCIONES.md).

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

---

## Fase 2a — Autenticación + esquema completo + infraestructura backend ✅

> Fase 2 se ha partido en sub-fases (2a … 2e) por tamaño. Esta es la 2a.

### Regla nueva aplicada desde aquí

- **TODOS los identificadores en castellano** (variables, funciones, clases, campos BBDD, enums, nombres de archivo y carpeta). Excepciones documentadas en [`CONVENCIONES.md`](./CONVENCIONES.md): APIs de librerías, acrónimos universales (JWT, API, REST, JSON, XML, FCM, DTO…), claves de variables de entorno (`NODE_ENV`, `PORT`, `DATABASE_URL`), nombres de archivo convencionales (`index.ts`, `Dockerfile`, `package.json`).
- Sin `ñ` ni tildes en identificadores (por compatibilidad con URLs, scripts, filesystems): `disenador`, `resena`, `contrasena`. Sí en strings de UI.

### Estructura backend post-merge

```
backend/
├── package.json (v0.2.0 con deps Fase 2)
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json, .prettierrc
├── Dockerfile (multi-stage alpine)
├── .dockerignore
└── src/
    ├── aplicacion.ts                ← Express + helmet + cors + rate-limit + /salud + /auth
    ├── index.ts                     ← arranque + cierre limpio (SIGTERM/SIGINT)
    ├── configuracion/
    │   └── entorno.ts               ← validación zod de process.env
    ├── utilidades/
    │   ├── registrador.ts           ← pino logger (JSON prod, pretty dev)
    │   ├── errores.ts               ← ErrorAplicacion + 6 subclases (POO + herencia)
    │   └── prisma.ts                ← singleton PrismaClient + cerrarConexionBd
    ├── middlewares/
    │   ├── autenticacion.ts         ← verificarJwt + module augmentation peticion.usuario
    │   ├── rbac.ts                  ← requerirRol + soloCliente/soloDisenador/soloAdmin
    │   ├── validacion.ts            ← validar(esquema, fuente)
    │   └── manejadorErrores.ts      ← traduce zod + Prisma + ErrorAplicacion a JSON
    └── modulos/autenticacion/
        ├── dto.ts                   ← dtoRegistro, dtoLogin, dtoRefresco, dtoCierreSesion
        ├── repositorio.ts           ← acceso Prisma a Usuario + TokenRefresco
        ├── servicio.ts              ← registro, login, refresco rotativo, logout
        ├── controlador.ts           ← thin layer HTTP (try/catch + next(error))
        └── rutas.ts                 ← 5 endpoints + JSDoc OpenAPI + rate-limit login
```

### Schema Prisma — 13 modelos + 9 enums (castellano)

`database/schema.prisma`. Modelos: `Usuario`, `Cliente`, `Disenador`, `Direccion`, `TokenRefresco`, `Producto`, `Variante`, `ImagenProducto`, `CertificadoSostenibilidad`, `CertificadoDeProducto`, `Carrito`, `ItemCarrito`, `Pedido`, `LineaPedido`, `Envio`, `Resena`, `Mensaje`. Enums: `Rol`, `CiudadGallega`, `TallaPrenda`, `MaterialPrincipal`, `EstadoPedido`, `MetodoPago`, `Transportista`, `EstadoModeracion`, `CodigoCertificado`. Columnas en `snake_case` castellano vía `@map` (`hash_contrasena`, `fecha_creacion`, `numero_pedido`…).

### Endpoints implementados (5/30+)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | `/auth/registro`   | no | Crear cuenta CLIENTE o DISEÑADOR; devuelve pareja de tokens |
| POST   | `/auth/login`      | no | Iniciar sesión (rate-limit 5 intentos / 15 min) |
| POST   | `/auth/refresh`    | no | Renovar pareja (rotación, reuso revoca todos los tokens) |
| POST   | `/auth/logout`     | no | Revocar el token de refresco actual (idempotente) |
| GET    | `/auth/yo`         | JWT | Devolver perfil del usuario autenticado |
| GET    | `/salud`           | no | Healthcheck para Docker |
| GET    | `/`                | no | Banner informativo |

### Seguridad implementada

- **bcrypt** con 12 rounds configurables (`BCRYPT_ROUNDS`).
- **JWT** de acceso (15 min) + **refresh token opaco** (7 días) almacenado **hasheado SHA-256** en BBDD.
- **Rotación** de refresh: cada uso emite nuevo par y revoca el anterior.
- **Detección de reuso**: si llega un token revocado → revoca **todos** los tokens del usuario (posible robo).
- **Rate limit global** + rate limit reforzado en `/auth/login` (anti fuerza bruta).
- **Helmet** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- **CORS** restrictivo a `CORS_ORIGIN`.
- **Mensaje genérico** en login fallido (evita user enumeration).
- **Logs** estructurados sin filtrar contraseñas ni tokens.

### Tests (3 archivos, 16 casos)

| Archivo | Casos | Cubre |
|---------|-------|-------|
| `tests/salud.test.ts` | 3 | Bootstrap: /salud, /, 404 |
| `tests/autenticacion.servicio.test.ts` | 8 | Lógica de negocio: registro, login, refresco, reuso, logout (mocks repo + bcrypt real) |
| `tests/autenticacion.rutas.test.ts` | 5 | Integración HTTP: validación zod, 409, 201, 401 sin token, 200 con token, 204 logout |

Cobertura objetivo del módulo `autenticacion`: **≥80%** (lo medimos en Fase 7 cuando esté toda la suite).

### Decisiones técnicas relevantes

| Decisión | Por qué |
|----------|---------|
| Refresh token **opaco aleatorio (48 bytes base64url)**, no JWT | Permite revocarlo (un JWT firmado no se revoca, solo expira). |
| Almacenamos **hash SHA-256** del refresh, no el token | Si la BBDD se filtra, los tokens no son reutilizables. |
| **Rotación** + **reuso = revocar todos** | Patrón OAuth 2.0 BCP. Si alguien roba un refresh y lo usa, en cuanto el usuario legítimo intente renovar, detectamos el reuso y se cierran sesiones. |
| Servicio expone funciones puras, no clase con DI | Más simple para tests + Jest mocks. Repository es un objeto literal con métodos. La "herencia + interfaces" del diagrama de clases se materializa en Fase 2b cuando aparezca el segundo módulo. |
| `validar(esquema, fuente)` middleware | Centraliza la validación, deja el controlador limpio. |
| `ErrorAplicacion` + subclases | Permite que el handler global mapee `codigoEstado` y `codigo` sin que cada controlador maneje su propio HTTP. |

### Verificación local (a ejecutar por el usuario)

```bash
cd "Galicia Wear/backend"
npm install
npx prisma generate --schema=../database/schema.prisma
npm test                      # → 16 tests verdes
npm run dev                   # → http://localhost:3000/salud
# Probar registro:
curl -X POST http://localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"correo":"ana@test.gal","contrasena":"Segura123","nombre":"Ana","apellidos":"López"}'
```

### Preguntas probables del tribunal — Fase 2a

1. **¿Por qué identificadores en castellano si la convención profesional es inglés?**
   > Aplico el principio de **lenguaje ubicuo** del Domain-Driven Design: el código habla el mismo idioma que el dominio del negocio. GaliciaWear es un marketplace gallego dirigido a usuarios hispanohablantes; los términos del negocio (diseñador, certificado de sostenibilidad, envío ecológico) nacen en castellano. Traducirlos al inglés introduciría una capa de traducción mental innecesaria y crearía divergencias sutiles entre el código y la conversación de producto. Lo documento en `CONVENCIONES.md` y es una decisión deliberada, no descuido.

2. **¿Por qué refresh tokens opacos y no JWTs anidados? ¿No es más simple usar dos JWTs?**
   > Los JWT son **stateless**: no se pueden revocar antes de su expiración. Si un atacante roba un JWT de refresh, puede usarlo 7 días sin que pueda hacer nada. Con un token opaco aleatorio guardado en BBDD (hasheado SHA-256), tengo dos superpoderes: (a) revocarlo individualmente al hacer logout; (b) detectar **reuso**: si llega un token ya marcado como `fechaRevocacion != null`, significa que alguien lo robó y lo está reutilizando — revoco todas las sesiones del usuario y le obligo a re-loguear. Es el patrón OAuth 2.0 BCP (Best Current Practice). El coste es una query a BBDD por refresh, pero los refresh ocurren cada 15 min, no es problema.

3. **El servicio de autenticación usa funciones (objeto literal) y no una clase. ¿No rompe el principio POO de la rúbrica?**
   > La rúbrica pide POO, y la POO la materializo donde aporta valor real, no por cumplir checklist. Concretamente: la jerarquía `ErrorAplicacion` → `ErrorValidacion / ErrorNoAutenticado / ErrorAccesoDenegado / ErrorNoEncontrado / ErrorConflicto / ErrorReglaDeNegocio` es POO genuina (herencia + polimorfismo gracias a `instanceof` en el handler). En Fase 2b, cuando aparezca el segundo módulo (productos), introduciré un `RepositorioBase<T>` genérico del que heredarán `RepositorioProducto`, `RepositorioPedido`, etc. — ahí se ve la herencia con genéricos. Pero un módulo aislado como `autenticacion` no necesita una clase: el servicio es un conjunto de operaciones puras sin estado. Imponer `class ServicioAutenticacion` con `static` por todas partes solo añade ruido.

---

---

## Fase 2b — Módulos usuarios, diseñadores, direcciones, certificados ✅

### Archivos generados (27 nuevos + 4 modificados)

**Utilidades nuevas:**

| Archivo | Función |
|---------|---------|
| `src/utilidades/repositorioBase.ts` | Interface `IRepositorio<T>` + clase abstracta `RepositorioBase<T>`. Materializa herencia + genéricos (rúbrica DAM). |
| `src/utilidades/cifrado.ts` | AES-256-GCM para IBAN. `cifrarTexto` / `descifrarTexto`. Clave de `IBAN_ENCRYPTION_KEY`. |

**Módulo usuarios (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/usuarios.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /usuarios/yo` | JWT | Perfil completo (sin hashContrasena ni ibanCifrado) |
| `PATCH /usuarios/yo/cliente` | JWT+CLIENTE | Actualizar nombre, apellidos, teléfono, nacimiento |
| `PATCH /usuarios/yo/contrasena` | JWT | Cambiar contraseña (verifica actual con bcrypt) |
| `DELETE /usuarios/yo` | JWT | Soft-delete GDPR (pone `fechaEliminacion`) |
| `PATCH /usuarios/yo/preferencias` | JWT+CLIENTE | Preferencias eco (certificados, maxKm, ciudad) |

**Módulo diseñadores (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/disenadores.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /disenadores` | público | Lista paginada de diseñadores validados |
| `GET /disenadores/:id` | público | Perfil público (IBAN omitido) |
| `POST /disenadores/solicitar` | JWT+DISEÑADOR | Crear perfil de marca con IBAN cifrado |
| `PATCH /disenadores/yo` | JWT+DISEÑADOR | Editar perfil de marca |
| `PATCH /disenadores/:id/validar` | JWT+ADMIN | Aprobar o rechazar un diseñador |

**Módulo direcciones (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/direcciones.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /direcciones` | JWT | Listar mis direcciones |
| `POST /direcciones` | JWT | Crear dirección |
| `PATCH /direcciones/:id` | JWT (propia) | Actualizar dirección |
| `DELETE /direcciones/:id` | JWT (propia) | Eliminar dirección |
| `PATCH /direcciones/:id/principal` | JWT (propia) | Marcar como dirección principal (transacción) |

**Módulo certificados (5 archivos):** `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/certificados.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /certificados` | público | Lista todos los certificados de sostenibilidad |
| `GET /certificados/:codigo` | público | Detalle por código enum (GOTS, OEKO_TEX…) |

### Tests totales acumulados (51)

| Suite | Tests | Cubre |
|-------|-------|-------|
| `salud.test.ts` | 3 | Bootstrap: /salud, /, 404 |
| `autenticacion.servicio.test.ts` | 8 | Lógica: registro, login, refresco, reuso, logout |
| `autenticacion.rutas.test.ts` | 5 | HTTP: /auth/registro, /auth/yo, /auth/logout |
| `usuarios.rutas.test.ts` | 8 | HTTP: perfil, actualizar, contraseña, eliminar, preferencias |
| `disenadores.rutas.test.ts` | 10 | HTTP: listar, obtener, solicitar, actualizar, validar |
| `direcciones.rutas.test.ts` | 7 | HTTP: listar, crear, eliminar (propio/ajeno), principal |
| `certificados.rutas.test.ts` | 10 | HTTP: listar, GOTS, código inválido, código no en seed |

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| `select` explícito en `RepositorioUsuarios` (sin `hashContrasena`) | Garantía a nivel ORM de que el hash nunca viaja en respuestas HTTP; menos riesgo de fuga accidental que filtrar en capas superiores. |
| `buscarHashContrasena` separado | Solo se fetch el hash cuando se necesita explícitamente (cambio de contraseña). Principio de mínimo privilegio en consultas. |
| IBAN cifrado AES-256-GCM, ibanCifrado omitido en `seleccionPublica` del repo disenadores | El IBAN se almacena en BBDD cifrado; la clave vive solo en entorno. Nunca se devuelve en respuestas de listado ni de perfil. |
| `$transaction` para `marcarPrincipal` | Atomicidad: si falla actualizar `cliente.direccionPredeterminadaId`, no se modifica `Direccion.esPrincipal` (y viceversa). |
| Seed con `upsert` | Idempotente: se puede ejecutar múltiples veces sin duplicados. Útil en onboarding del evaluador. |
| `cifrado.ts` mockeado en tests de disenadores | El cifrado real no aporta cobertura en tests de rutas HTTP; se testa la lógica del cifrado por separado. |
| Rutas `disenadores`: `/solicitar`, `/yo` antes de `/:id` | Express evalúa en orden; los literales deben ir antes del parámetro dinámico para no capturarlo. |

### Verificación local

```bash
cd "Galicia Wear/backend"
npm run prisma:generate
npm test                     # → 51 tests verdes

# Con Postgres corriendo:
npm run prisma:migrate -- --name fase2b
npm run seed                 # → 6 certificados + 1 admin + 2 clientes + 2 diseñadores

curl http://localhost:3000/certificados
curl http://localhost:3000/disenadores
curl http://localhost:3000/certificados/GOTS
```

### Preguntas probables del tribunal — Fase 2b

1. **¿Por qué `RepositorioBase<T>` si Prisma ya abstrae la BBDD?**
   > `RepositorioBase<T>` cumple dos objetivos distintos: (a) Demuestra el patrón herencia + genéricos que exige la rúbrica DAM (la jerarquía `IRepositorio<T>` → `RepositorioBase<T>` → `RepositorioUsuarios` es polimorfismo real). (b) Centraliza el singleton Prisma, por lo que cada módulo no repite la importación y en tests se puede inyectar un mock completo del repositorio sin tocar la cadena de herencia. El argumento "Prisma ya abstrae" es válido en apps con un único modelo de datos; en un marketplace con 4 módulos distintos, el repositorio concreto aporta tipado fuerte y separación de responsabilidades.

2. **¿Por qué AES-256-GCM para el IBAN y no bcrypt?**
   > Porque el IBAN necesita **descifrado** (para transferencias, facturación) y bcrypt es unidireccional. AES-256-GCM aporta confidencialidad **y** autenticación del texto cifrado (el tag GCM detecta cualquier manipulación del dato cifrado en BBDD). La clave nunca toca la BBDD — vive en la variable de entorno `IBAN_ENCRYPTION_KEY`.

3. **¿Por qué `$transaction` en `marcarPrincipal` y no dos `update` secuenciales?**
   > Porque si el servidor cae entre los dos `update`, la BBDD quedaría en estado inconsistente: la dirección marcada como principal y el campo `cliente.direccionPredeterminadaId` apuntando a otra. Con `$transaction`, Postgres aplica ACID: o se aplican los tres cambios juntos o ninguno.

---

---

## Fase 2c — Módulos productos, variantes, imágenes ✅

### Archivos generados (18 nuevos + 3 modificados)

**Módulo productos (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/productos.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /productos` | público | Lista con filtros: busqueda, material, ciudad, maxKm, certificado |
| `GET /productos/:slug` | público | Detalle completo: variantes + imágenes + certificados |
| `POST /productos` | JWT+DISEÑADOR | Crear producto (slug generado automáticamente) |
| `PATCH /productos/:id` | JWT+DISEÑADOR (propio) | Actualizar nombre, precio, km, material, activo |
| `DELETE /productos/:id` | JWT+DISEÑADOR (propio) | Soft delete (activo=false) |

**Módulo variantes (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/variantes.rutas.test.ts`

Rutas nested bajo `/productos/:productoId/variantes` con `Router({ mergeParams: true })`.

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /productos/:productoId/variantes` | público | Lista tallas/colores/stock |
| `POST /productos/:productoId/variantes` | JWT+DISEÑADOR | Crear variante con SKU |
| `PATCH /productos/:productoId/variantes/:id` | JWT+DISEÑADOR | Actualizar stock/color/precio |
| `DELETE /productos/:productoId/variantes/:id` | JWT+DISEÑADOR | Eliminar variante |

**Módulo imágenes (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/imagenes.rutas.test.ts`

Rutas nested bajo `/productos/:productoId/imagenes`.

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /productos/:productoId/imagenes` | público | Lista imágenes (principal primero) |
| `POST /productos/:productoId/imagenes` | JWT+DISEÑADOR | Añadir imagen (stub URL — subida real en Fase 6) |
| `PATCH /productos/:productoId/imagenes/:id/principal` | JWT+DISEÑADOR | Marcar como imagen principal (transacción) |
| `PATCH /productos/:productoId/imagenes/:id` | JWT+DISEÑADOR | Actualizar alt text / posición |
| `DELETE /productos/:productoId/imagenes/:id` | JWT+DISEÑADOR | Eliminar imagen |

### Tests totales acumulados (75)

| Suite | Tests |
|-------|-------|
| Fases anteriores (salud + auth + usuarios + disenadores + direcciones + certificados) | 51 |
| `productos.rutas.test.ts` | 9 |
| `variantes.rutas.test.ts` | 8 |
| `imagenes.rutas.test.ts` | 7 |

### Seed ampliado

- 3 productos de Liñares Moda (CORUNA):
  - *Camiseta Lino Gallego* — LINO, km 15, cert. GOTS, 3 variantes
  - *Jersey Lana Atlántica* — LANA_RECICLADA, km 45, cert. GRS, 3 variantes
  - *Falda Algodón Orgánico* — ALGODON_ORGANICO, km 20, cert. GOTS+OEKO_TEX, 3 variantes
- Cada producto tiene 1 imagen placeholder (Unsplash)

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| Routers anidados con `mergeParams: true` | Permite que `peticion.params.productoId` sea accesible en los sub-routers de variantes e imágenes sin romper la encapsulación. |
| `use('/:productoId/variantes', ...)` antes de `get('/:slug', ...)` | Express evalúa en orden; el `use` con 2 segmentos debe estar antes del `get` con 1 para no generar ambigüedad en el enrutado. |
| Filtro `busqueda` como `ILIKE` en nombre+descripción | Suficiente para Fase 2c; full-text con `to_tsvector` se añade en Fase 7 junto con el índice GIN. |
| `eliminar` como soft-delete (`activo=false`) | Los pedidos existentes referencian `Variante`; una eliminación física rompería la integridad referencial. El admin puede ver productos inactivos en Fase 5 (desktop). |
| Tipos exportados manualmente en `repositorio.ts` de productos | Evita incompatibilidades entre `as const` y los `orderBy` anidados de Prisma, que no son compatibles con `readonly` arrays. |

### Verificación local

```bash
cd "Galicia Wear/backend"
npm test                       # → 75 tests verdes

# Con Postgres corriendo:
npm run prisma:migrate -- --name fase2c
npm run seed                   # → 3 productos + variantes + imágenes + certificados

curl http://localhost:3000/productos
curl "http://localhost:3000/productos?material=LINO&maxKm=20"
curl "http://localhost:3000/productos?certificado=GOTS"
curl http://localhost:3000/productos/camiseta-lino-gallego-seed
```

### Preguntas probables del tribunal — Fase 2c

1. **¿Por qué los filtros de sostenibilidad están en el propio endpoint GET /productos?**
   > Porque el buyer persona "Ana" filtra activamente por certificado, distancia y material antes de entrar en detalle. Exponer los filtros en el endpoint de lista evita una segunda llamada al servidor para refinar resultados. En Prisma, los filtros sobre relaciones (`certificados.some.certificado.codigo`) se traducen a joins SQL eficientes. El coste de un índice extra en `Producto.materialPrincipal` es mínimo vs. el beneficio de UX.

2. **¿Por qué imágenes son URLs y no archivos subidos?**
   > En Fase 2c es un stub intencionado. La integración con almacenamiento externo (S3/Cloudinary) requiere configurar credenciales de terceros y manejar multipart/form-data. Separar la API de subida de la lógica de negocio es buena práctica. En Fase 6 (web), el componente de upload enviará el archivo al proveedor y guardará la URL resultante — este endpoint ya está listo para recibir esa URL.

3. **¿Qué ocurre con las variantes si se desactiva un producto?**
   > Las variantes permanecen en BBDD (`activo` solo está en `Producto`). Esto es intencional: si el diseñador vuelve a activar el producto, las variantes ya están listas. Los pedidos históricos que referencian esas variantes siguen siendo coherentes. La ruta GET pública ya filtra `activo: true`, así que las variantes de productos inactivos no se exponen al público.

---

---

## Fase 2d — Módulos carrito, pedidos, envíos ✅

### Archivos generados (17 nuevos + 2 modificados)

**Módulo carrito (6 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/carrito.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /carrito` | JWT+CLIENTE | Carrito con ítems, variante, producto e imagen principal |
| `POST /carrito/items` | JWT+CLIENTE | Añadir/actualizar artículo (upsert por varianteId) |
| `DELETE /carrito/items/:varianteId` | JWT+CLIENTE | Eliminar artículo concreto |
| `DELETE /carrito` | JWT+CLIENTE | Vaciar todo el carrito |

**Módulo pedidos (5 archivos):** `dto.ts` · `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/pedidos.rutas.test.ts`

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `POST /pedidos` | JWT+CLIENTE | Checkout: valida stock, calcula totales, crea pedido (transacción ACID), vacía carrito |
| `GET /pedidos` | JWT | Lista: clientes ven sus compras; diseñadores sus ventas |
| `GET /pedidos/:id` | JWT | Detalle (con autorización: solo el cliente o diseñador del pedido) |
| `PATCH /pedidos/:id/pagar` | JWT+CLIENTE | Stub payment (PENDIENTE_PAGO → PAGADO) |
| `PATCH /pedidos/:id/aceptar` | JWT+DISEÑADOR | Acepta sus líneas + crea Envio stub (PAGADO → ACEPTADO) |
| `PATCH /pedidos/:id/cancelar` | JWT | Cancela y restaura stock (PENDIENTE_PAGO/PAGADO → CANCELADO) |

**Módulo envíos (5 archivos, nested):** `repositorio.ts` · `servicio.ts` · `controlador.ts` · `rutas.ts` · `tests/envios.rutas.test.ts`

Rutas nested bajo `/pedidos/:pedidoId/envio` con `Router({ mergeParams: true })`.

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /pedidos/:pedidoId/envio` | JWT (cliente o diseñador del pedido) | Ver datos del envío |
| `PATCH /pedidos/:pedidoId/envio` | JWT+DISEÑADOR | Actualizar tracking, transportista; marcar ENVIADO/ENTREGADO |

### Tests totales acumulados (98)

| Suite | Tests |
|-------|-------|
| Fases anteriores (75) | 75 |
| `carrito.rutas.test.ts` | 8 |
| `pedidos.rutas.test.ts` | 8 |
| `envios.rutas.test.ts` | 7 |

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| Transacción checkout re-verifica stock | Pre-check en el servicio detecta problemas obvios; la re-verificación dentro de `$transaction` protege de race conditions donde dos clientes compran el último stock simultáneamente. |
| `cancelar` restaura stock en la misma transacción | Si la actualización del estado falla, el stock vuelve a su valor anterior (atomicidad garantizada). |
| Número de pedido `GW-YYYY-NNNNN` generado con `COUNT` dentro de la transacción | Sencillo para TFG + la restricción `@unique` en `numeroPedido` es la última línea de defensa contra duplicados. |
| Envío gratuito ≥50€, coste fijo 4,90€ para el resto | Regla de negocio simple y justificable ante el tribunal. Se puede parametrizar en Fase 7. |
| `pagar` como stub | La integración con pasarela real (Stripe/Redsys) escapa al alcance del TFG; el endpoint permite demostrar el flujo completo sin dependencias externas. |
| Máquina de estados explícita por `estadosCancelables: EstadoPedido[]` | Declarar el array con tipo explícito satisface a TypeScript y documenta intencionalmente qué estados permiten cancelación. |

### Verificación local

```bash
cd "Galicia Wear/backend"
npm test                       # → 98 tests verdes

# Flujo completo (con Postgres + seed ejecutado):
# 1. Registro cliente
curl -X POST http://localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"correo":"ana@test.gal","contrasena":"Prueba123","nombre":"Ana","apellidos":"López","rol":"CLIENTE"}'

# 2. Añadir al carrito (usar varianteId del seed)
curl -X POST http://localhost:3000/carrito/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"varianteId":"<id-variante>","cantidad":1}'

# 3. Checkout
curl -X POST http://localhost:3000/pedidos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direccionEnvioId":"<id-direccion>","metodoPago":"TARJETA"}'
```

### Preguntas probables del tribunal — Fase 2d

1. **¿Por qué dos verificaciones de stock (servicio + transacción)?**
   > El servicio hace un pre-check ligero que devuelve error claro al usuario sin abrir una transacción. La re-verificación dentro de `$transaction` es la garantía real de consistencia: Postgres serializa los accesos, por lo que si dos requests concurrentes pasan el pre-check pero solo hay 1 unidad, solo una transacción tendrá éxito — la otra encontrará stock=0 y lanzará error 500 (que el servicio traduce a ErrorReglaDeNegocio antes del commit).

2. **¿Cómo se gestiona un pedido multi-diseñador?**
   > Cada `LineaPedido` lleva su propio `disenadorId` y `estadoLinea`. El diseñador A solo puede aceptar/enviar sus propias líneas. El `Pedido.estado` general avanza a ACEPTADO cuando TODAS las líneas están aceptadas; si solo acepta el diseñador A pero no B, el pedido permanece en PAGADO. Esto permite envíos parciales mientras el tribunal no lo exija, y es lo que modela el diagrama UML de la Fase 1.

3. **¿Por qué `cancelar` restaura stock pero `eliminar`(soft-delete de producto) no?**
   > Son eventos de naturaleza diferente. `cancelar` es un hecho de negocio que deshace el compromiso de stock (el cliente ya no quiere comprar). El soft-delete de producto ocurre mientras puede haber pedidos en curso con ese producto — si liberásemos stock ahí, estaríamos incrementando stock de un producto que el diseñador acaba de retirar, lo que induciría a error. El stock de un producto inactivo simplemente "queda congelado" y el admin puede gestionarlo desde el panel.

---

---

## Fase 2e — Swagger / OpenAPI ✅

### Archivos (1 nuevo + 2 modificados)

| Archivo | Cambio |
|---------|--------|
| `src/configuracion/swagger.ts` | Config `swagger-jsdoc`: OpenAPI 3.0.3, 11 tags, security scheme Bearer JWT |
| `src/aplicacion.ts` | Monta `/api/docs` (Swagger UI) + `/api/docs.json` (spec JSON) |
| `tests/salud.test.ts` | Smoke test: verifica que `/api/docs.json` devuelve spec válida |

### Endpoints nuevos

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/docs` | Swagger UI interactiva (HTML) |
| `GET /api/docs.json` | Especificación OpenAPI 3.0.3 en JSON |

### Tests: 99/99 verdes

---

## Fase 2 — Backend completo ✅

**Resumen de la Fase 2 completa (sub-fases 2a → 2e):**

| Sub-fase | Módulos | Tests |
|----------|---------|-------|
| 2a | Auth JWT + refresh + schema Prisma | 16 |
| 2b | Usuarios · Diseñadores · Direcciones · Certificados · RepositorioBase\<T\> | 51 |
| 2c | Productos · Variantes · Imágenes (rutas nested) | 75 |
| 2d | Carrito · Pedidos (checkout ACID) · Envíos | 98 |
| 2e | Swagger UI `/api/docs` | 99 |

**Total backend:** 13 módulos · 66 endpoints · 99 tests · API documentada.

---

---

## Fase 3a — MongoDB: modelos + conexión al servidor del colegio ✅

### Servidor: `dam2.colexio-karbo.com:57017` · Base: `psuarezvarela`

**Archivos nuevos (9):**

| Archivo | Función |
|---------|---------|
| `backend/.env` | Credenciales reales (gitignored) — incluye `MONGO_URI` |
| `src/utilidades/mongo.ts` | Singleton Mongoose con reconexión automática |
| `src/utilidades/auditoria.ts` | Fire-and-forget para `ActivityLog` (no bloquea flujo principal) |
| `src/modulos/mongo/esquemas/actividadLog.ts` | TTL 90 días · índices usuarioId + accion |
| `src/modulos/mongo/esquemas/recomendacion.ts` | TTL por campo fechaExpiracion |
| `src/modulos/mongo/esquemas/mediaResena.ts` | Fotos/vídeos de reseñas (binarios fuera de Postgres) |
| `src/modulos/mongo/esquemas/carritoAnonimo.ts` | TTL 30 días de inactividad |
| `src/modulos/mongo/esquemas/notificacionLog.ts` | TTL 60 días · 8 tipos de notificación |
| `src/modulos/mongo/index.ts` | Barrel export de todos los modelos |

**Colecciones creadas en `psuarezvarela`:**
- `activity_logs` — TTL 90 días, índices: usuarioId, accion, fechaCreacion
- `recommendations` — TTL por fechaExpiracion (0 = usa el propio campo)
- `review_media` — único por resenaId
- `anonymous_carts` — TTL 30 días por fechaActualizacion
- `notification_logs` — TTL 60 días, índices: destinatarioId, leida, fechaCreacion

**Integración:** `index.ts` conecta a MongoDB al arrancar (fallo silencioso si no está disponible). El servicio de autenticación escribe `REGISTRO` y `LOGIN` a `activity_logs`.

**Tests: 99/99 verdes** (mock de `auditoria` añadido a los tests de autenticación).

### Preguntas probables del tribunal — Fase 3a

1. **¿Por qué MongoDB para los logs y no otra tabla en PostgreSQL?**
   > PostgreSQL es excelente para datos transaccionales con relaciones estrictas, pero los logs de actividad tienen patrones de escritura muy distintos: alta frecuencia, sin joins, sin transacciones, y necesitan expirar automáticamente (TTL). MongoDB ofrece TTL indexes nativos, escrituras de alta velocidad sin coordinación y un esquema flexible que permite añadir campos de detalles variables sin migraciones. Además, la rúbrica DAM exige explícitamente dos tipos de BBDD.

2. **¿Qué es un TTL index en MongoDB y por qué lo usas aquí?**
   > Un TTL (Time To Live) index le dice a MongoDB que borre automáticamente los documentos `N` segundos después del valor del campo indexado. En `activity_logs`, el TTL de 90 días significa que los logs más antiguos se purgan sin ninguna tarea programada — MongoDB lo hace internamente con un proceso background que corre cada 60 segundos. Esto evita crecimiento ilimitado de la colección sin intervención manual.

3. **¿Por qué el logger de auditoría es "fire-and-forget" en vez de `await`?**
   > La escritura del log no es parte del contrato de negocio: si el login de Ana funciona pero el log falla (MongoDB no disponible), Ana debe poder entrar igualmente. Si hago `await`, un fallo de Mongo se propaga al cliente como un 500 inexplicable. Con fire-and-forget, el error queda en los logs del servidor (pino) pero el flujo principal continúa. Es el mismo principio que usan Google Analytics o Datadog: la telemetría no puede tumbar la operación principal.

---

## Próxima fase

---

## Fase 3b — backup.sh + restore.sh + export/import XML/JSON + admin ✅

### Archivos generados (8 nuevos + 2 modificados)

**Scripts (`scripts/`):**

| Script | Función |
|--------|---------|
| `backup.sh` | `pg_dump` + `mongodump` → `.tar.gz` con timestamp · retención 30 días · cron `0 3 * * *` |
| `restore.sh` | Extrae backup → `pg_restore` + `mongorestore --drop` |

**Módulo admin (`src/modulos/admin/`):**

| Archivo | Función |
|---------|---------|
| `repositorio.ts` | Estadísticas del dashboard + query de productos para exportar |
| `exportacion.ts` | `worker_threads` eval-mode: genera XML o JSON sin bloquear el event loop |
| `importacion.ts` | `fast-xml-parser` para XML; JSON nativo; upsert de productos en PostgreSQL |
| `controlador.ts` | Handlers HTTP para stats, export y import |
| `rutas.ts` | 4 endpoints ADMIN: `/estadisticas`, `/exportar/productos.json`, `/exportar/productos.xml`, `/importar/productos` |
| `tests/admin.rutas.test.ts` | 8 tests: auth, permisos, stats, export JSON/XML, import JSON/XML |

### Endpoints admin (todos JWT+ADMIN)

| Endpoint | Descripción |
|----------|-------------|
| `GET /admin/estadisticas` | KPIs: usuarios, productos, pedidos mes, ingresos, estado pedidos |
| `GET /admin/exportar/productos.json` | Descarga JSON del catálogo (worker_threads) |
| `GET /admin/exportar/productos.xml` | Descarga XML del catálogo (worker_threads) |
| `POST /admin/importar/productos` | Body: `{ formato, datos }` — crea/actualiza productos desde JSON o XML |

### Tests: 107/107 verdes

### Cobertura de rúbrica DAM cubierta en Fase 3

| Contenido DAM | Cómo se cubre |
|---|---|
| BBDD NoSQL (MongoDB) | 5 colecciones con TTL, conexión Mongoose, logs de auditoría |
| Script backup | `backup.sh` + `restore.sh` funcionales |
| XML/JSON import/export | `/admin/exportar/productos.xml` + `.json` + `/admin/importar/productos` |
| Hilos + comunicación entre procesos | `worker_threads` eval-mode en `exportacion.ts` |

### Preguntas probables del tribunal — Fase 3b

1. **¿Por qué worker_threads para generar el XML si Node ya es asíncrono?**
   > Node.js es single-threaded en el event loop: operaciones de E/S (red, disco) son asíncronas pero el procesado de CPU (construir un string XML de 10 000 productos) bloquea el hilo principal durante cientos de milisegundos. En ese tiempo, otras peticiones al servidor quedarían en cola. `worker_threads` crea un hilo OS separado con su propio contexto V8 → el event loop principal sigue libre. El worker recibe los datos via `workerData` (paso por copia, sin memoria compartida) y devuelve el resultado via `parentPort.postMessage`. Esto es diferente a los `child_process` (que arrancan un nuevo proceso): los workers son más ligeros porque comparten el mismo proceso Node.

2. **¿Por qué el import usa un envelope JSON `{ formato, datos }` en vez de Content-Type nativo?**
   > Express aplica `express.json()` globalmente antes de que llegue a cualquier ruta. Para `Content-Type: application/xml`, el body quedaría sin parsear (raw stream). Aunque se puede añadir un middleware por ruta que lee el stream crudo, choca con la forma en que Supertest envía los datos en el entorno de test. El envelope JSON es más predecible, más fácil de documentar en Swagger y evita diferencias de comportamiento entre frameworks de test y producción. Es el mismo patrón que usan APIs como Cloudinary o AWS cuando necesitan mezclar datos binarios/XML con metadatos.

3. **El `backup.sh` usa `pg_dump --format=custom`. ¿Qué ventaja tiene sobre `--format=plain` (SQL)?**
   > El formato `custom` (`-Fc`) genera un fichero binario comprimido que: (a) es significativamente más pequeño que el SQL plano; (b) permite restauración selectiva tabla a tabla con `pg_restore --table=...`; (c) soporta restauración paralela con `pg_restore --jobs=N` para bases de datos grandes; (d) siempre es compatible con la versión mayor de PostgreSQL en adelante. El SQL plano es útil para inspección manual, pero para backups automáticos el formato custom es la práctica profesional estándar.

---

## Fase 3 — Persistencia avanzada COMPLETA ✅

| Sub-fase | Contenido |
|----------|-----------|
| 3a | MongoDB servidor colegio, 5 colecciones con TTL, auditoría fire-and-forget |
| 3b | backup.sh + restore.sh + export/import XML/JSON + worker_threads + stats admin |

---

---

## Fase 4 — App móvil Android (Java nativo) ✅

- **Última actualización**: 2026-05-21.
- **Rama**: `Fase4`.

### Archivos generados (~95 nuevos)

#### Configuración de build

| Archivo | Función |
|---------|---------|
| `android/gradle/libs.versions.toml` | Version catalog completo: Hilt 2.52, Retrofit 2.11, Room 2.6, Socket.IO 2.1, Firebase BoM 33.6, Glide 4.16 |
| `android/build.gradle` | Plugins raíz: AGP + Hilt + Google Services |
| `android/app/build.gradle` | Todas las dependencias + ViewBinding + BuildConfig + Java 17 |
| `android/app/google-services.json` | Stub FCM (reemplazar con proyecto Firebase real en producción) |

#### Infraestructura Java

| Capa | Clases clave | Patrón |
|------|-------------|--------|
| Application | `AppGaliciawear` | @HiltAndroidApp, canal de notificaciones |
| Sesión | `GestorSesion` | Singleton SharedPreferences — tokens JWT, onboarding flag |
| Utilidades | `Constantes`, `RecursoUi<T>` | Resource wrapper (Loading/Success/Error) |
| DI | `ModuloRed`, `ModuloBaseDatos`, `ModuloRepositorios` | Hilt @Module @InstallIn(SingletonComponent) |

#### Capa de datos

| Sub-capa | Clases |
|----------|--------|
| DTOs Retrofit | `DtoRespuestaToken/Usuario/Producto/Carrito/Pedido/Mensaje`, `DtoPeticionLogin/Registro/CarritoItem/Pedido`, `DtoRespuestaListaProductos` |
| API Retrofit | `ServicioApi` — 20+ endpoints: auth, productos, carrito, pedidos |
| Interceptor OkHttp | `InterceptorJwt` — añade `Authorization: Bearer` + logout en 401 |
| Room (caché offline) | `EntidadProducto`, `EntidadItemCarrito`, `DaoProducto`, `DaoCarrito`, `BaseDatosLocal` |
| Repositorios | `RepositorioAutenticacion`, `RepositorioProductos` (cache-then-network), `RepositorioCarrito`, `RepositorioPedidos`, `RepositorioChat` (Socket.IO) |

#### MVVM — ViewModels

`ModeloVistaAutenticacion`, `ModeloVistaProductos` (filtros persistentes), `ModeloVistaCarrito`, `ModeloVistaPedidos`, `ModeloVistaChat`, `ModeloVistaPerfil`

#### UI — 10 pantallas

| # | Pantalla | Clase | Criterio UX aplicado |
|---|----------|-------|---------------------|
| 1 | Splash + animación | `ActividadSplash` | Feedback inmediato: logo fade-in 900ms |
| 2 | Onboarding (3 slides) | `ActividadIncorporacion` + `AdaptadorIncorporacion` | Ley de Hick: solo 3 pantallas, 2 botones |
| 3 | Login / Registro | `ActividadAutenticacion` + `FragmentoLogin` + `FragmentoRegistro` | Prevención errores: botón desactivado; errores en TextInputLayout |
| 4 | Hub principal (5 tabs) | `ActividadPrincipal` + `FragmentoInicio/Buscador/Carrito/Pedidos/Perfil` | Ley de Fitts: BottomNav en zona pulgar; badge carrito |
| 5 | Detalle producto | `ActividadDetalleProducto` | Chips variantes (Hick); botón AR stub; Snackbar con acción |
| 6 | Buscador con filtros | `FragmentoBuscador` | Chips certificados (GOTS/OEKO-TEX/GRS); filtros persistentes en ViewModel |
| 7 | Carrito + Checkout | `FragmentoCarrito` + `ActividadCheckout` | Envío eco switch; ACID en backend |
| 8 | Mis pedidos | `FragmentoPedidos` + `ActividadDetallePedido` | Tracking + número de seguimiento |
| 9 | Chat Socket.IO | `ActividadChat` + `AdaptadorMensajes` | Burbujas distintas (propio/ajeno); indicator conexión |
| 10 | Perfil + logout | `FragmentoPerfil` | Confirmación AlertDialog (prevención de errores) |

#### FCM

`ServicioFcm` — `@AndroidEntryPoint`, `onNewToken()`, `onMessageReceived()`, canal de notificaciones Android 8+

#### Tests

| Suite | Tests | Tipo |
|-------|-------|------|
| `ModeloVistaProductosTest` | 4 | JUnit + Mockito (unitario) |
| `RepositorioAutenticacionTest` | 4 | JUnit + Mockito (unitario) |
| `FlujoPantallaLoginTest` | 4 | Espresso (UI) |
| `FlujoCarritoTest` | 2 | Room integration (Android) |

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| MVVM con LiveData (no Coroutines) | El proyecto es Java puro. LiveData + callbacks Retrofit es idiomático en Java Android; Coroutines requiere Kotlin. |
| Cache-then-network en RepositorioProductos | Respuesta visual inmediata (Ley de Fitts). Room emite datos cacheados antes de que llegue la red. |
| RepositorioChat @Singleton | El socket no se recrea en cada rotación de pantalla. El ViewModel observa nuevoMensaje con `observeForever`. |
| Socket.IO con `auth` callback | Socket.IO v4 usa autenticación basada en `auth` en el handshake. El callback en Java evita capturar referencias a `this` con riesgo de leak. |
| Google Services stub | La app compila y arranca sin credenciales FCM reales. El stub permite desarrollo sin acceso a Firebase Console. |
| ViewBinding (no DataBinding) | ViewBinding genera código de acceso a vistas sin expressions en XML — más simple, más rápido de compilar, sin riesgo de NPE por bindings nulos. |
| `attach/detach` vs `replace` en fragmentos | `replace` destruye y recrea el fragmento al cambiar de pestaña. Con `show/hide` se conserva el estado de scroll y los campos de búsqueda. |
| Confirmación AlertDialog en logout | Prevención de errores: acción destructiva/irreversible requiere confirmación explícita (principio de diseño UI/UX). |

### Verificación local

```bash
# 1. Sincronizar Gradle (desde Android Studio: File → Sync Project with Gradle Files)
#    O desde línea de comandos:
cd "Galicia Wear/android"
./gradlew assembleDebug                # Build del APK de debug

# 2. Tests unitarios (sin emulador)
./gradlew test

# 3. Tests instrumentados (requiere emulador o dispositivo conectado)
./gradlew connectedAndroidTest

# 4. Instalar en emulador y probar flujo completo:
./gradlew installDebug
# Arrancar también el backend:
cd ../backend && npm run dev           # http://10.0.2.2:3000 desde el emulador
```

### Preguntas probables del tribunal — Fase 4

1. **¿Por qué MVVM y no MVC o MVP en Android?**
   > MVVM es el patrón oficial de Google para Android desde 2017. El ViewModel sobrevive a las rotaciones de pantalla (el `Activity` se destruye pero el ViewModel no), lo que evita volver a cargar datos de red innecesariamente. LiveData garantiza que la UI solo se actualiza cuando está en estado STARTED/RESUMED, eliminando crashes por actualizar vistas destruidas. MVP tendría el mismo problema de rotaciones y requeriría gestionar manualmente el ciclo de vida. MVC en Android mezcla lógica de presentación con Activity, creando "God Activities" de 1000+ líneas imposibles de testear.

2. **¿Por qué Hilt para la inyección de dependencias?**
   > Hilt es la solución DI oficial de Google para Android, construida sobre Dagger 2. Genera código de binding en tiempo de compilación (no reflexión en runtime), lo que lo hace rápido y seguro. El principal beneficio para el TFG es la testabilidad: en los tests unitarios se inyectan mocks del repositorio sin cambiar nada en el ViewModel. Sin DI, el ViewModel crearía sus dependencias internamente (`new RepositorioProductos()`) y sería imposible aislarlas para testear. La alternativa manual (ServiceLocator) escala peor y es propenso a errores de threading.

3. **¿Cómo funciona la comunicación en tiempo real con Socket.IO?**
   > El `RepositorioChat` es un @Singleton que gestiona un objeto `Socket` de la librería `socket.io-client-java`. Al entrar al chat, llama a `conectar()` que abre una conexión WebSocket con el backend mediante el handshake Socket.IO v4 (protocolo sobre HTTP que luego hace upgrade a WebSocket). El token JWT se envía en el payload `auth` del handshake para que el servidor autorice la conexión. Los mensajes se reciben en un listener `socket.on("nuevo_mensaje", ...)` que actualiza un `MutableLiveData<DtoRespuestaMensaje>`. El ViewModel observa este LiveData con `observeForever` y añade cada mensaje a la lista. El RecyclerView del chat, que observa la lista, se actualiza automáticamente. Cubre el requisito DAM "Sockets/WebSockets e hilos".

## Fase 5 — App de escritorio JavaFX (Panel Admin) ✅

- **Última actualización**: 2026-06-03.
- **Rama**: `main`.

### Parte A — Endpoints admin añadidos al backend (para que el panel sea funcional)

Toda la lógica ya existía; se expusieron variantes con scope ADMIN reutilizando los repositorios.

| Endpoint nuevo | Implementación |
|----------------|----------------|
| `GET /admin/logs` | Lee `activity_logs` de MongoDB (paginado + filtros accion/usuarioId/recurso) |
| `GET /admin/pedidos` | Listado global paginado + filtro por estado (`RepositorioPedidos.listarTodos`) |
| `GET /admin/disenadores` | Listado incl. pendientes (`RepositorioDisenadores.listarTodos`, filtro `validado`) |
| `GET /admin/productos` | Catálogo completo incl. inactivos (`RepositorioProductos.listarTodos`) |
| `PATCH /admin/productos/:id` · `DELETE /admin/productos/:id` | Moderar/retirar sin comprobación de propiedad |

Además se corrigieron dos problemas preexistentes que impedían compilar/pasar los tests tras la
migración a MySQL: `mode: 'insensitive'` (no soportado por el cliente Prisma de MySQL) en el
listado público de productos, y un mock incompleto (`buscarPerfilCompleto`) en el test de `/auth/yo`.

**Backend: 8 archivos modificados + 1 nuevo (`admin/dto.ts`). Tests: 114/114 verdes** (antes 107;
+7 casos admin).

### Parte B — App de escritorio (`desktop-admin/`)

Proyecto **Maven** `gal.galiciawear:panel-admin` (Java 17 / JavaFX 21), arquitectura **MVC**.

| Capa | Clases |
|------|--------|
| Arranque | `Lanzador` (main neutro para fat-JAR), `AplicacionPanel` (Application) |
| Configuración | `Configuracion` (URL API por env), `GestorSesion` (tokens en `Preferences`) |
| Modelo | records `UsuarioBasico`, `RespuestaAutenticacion`, `Estadisticas`, `Disenador`, `Producto`,`Pedido`, `LogActividad`, `ResultadoImportacion` |
| Servicio (capa modelo MVC) | `ClienteHttp` (OkHttp + Bearer + refresh en 401), `ServicioBase` y 7 servicios REST |
| Núcleo | `Contexto` (DI manual), `Navegacion` (router FXML con controllerFactory) |
| Util | `EjecutorTareas` (Task/hilos), `Alertas` (diálogos) |
| Vistas | 7 FXML + `tema.css` (paleta atlantic/galego/sand) |
| Controladores | Login, Principal (shell), Dashboard, Diseñadores, Productos, Pedidos, ImportExport, Logs |

**8 vistas**: Login (solo ADMIN) · Dashboard (KPIs + PieChart, auto-refresco 15 s) · Diseñadores
(validar) · Productos (moderar/retirar) · Pedidos (cancelar) · Importar/Exportar (JSON+XML) · Logs.

**Empaquetado**: `mvn package` → fat-JAR ejecutable (13,9 MB, JavaFX embebido) + `empaquetar.sh`
con `jpackage` (.dmg en macOS, .deb/app-image en Linux).

### Tests (14 — desktop)

| Suite | Tests | Tipo |
|-------|-------|------|
| `GestorSesionTest` | 4 | JUnit 5 (Preferences aisladas) |
| `ClienteHttpTest` | 2 | JUnit 5 + MockWebServer (Bearer + refresh en 401) |
| `ServicioAutenticacionTest` | 3 | JUnit 5 + MockWebServer (login ADMIN / no-admin / 401) |
| `ServicioProductosTest` | 3 | JUnit 5 + MockWebServer (listar / patch / delete) |
| `ControladorLoginTest` | 2 | TestFX (avisos y error de credenciales) |

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| El panel NO accede a BBDD; solo a la API REST | Única fuente de verdad; MySQL/Mongo viven en el servidor del centro. Cumple "las únicas BBDD son las remotas". |
| Sesión en `java.util.prefs.Preferences`, no en BBDD/SQLite | Persistir un token no justifica una BBDD embebida; `Preferences` es nativo de la JDK. |
| Auto-refresco por polling (`ScheduledService` 15 s) en vez de WebSocket | El backend aún no tiene servidor Socket.IO; el polling cubre el "dashboard en vivo" y el requisito de hilos sin tocar el backend. |
| DI manual con `Contexto` + `controllerFactory` | Para una app de escritorio pequeña, un contenedor explícito es más claro que un framework de DI. |
| Clasificador JavaFX por perfiles de Maven según SO | El clasificador de JavaFX (`mac-aarch64`, `linux`…) no coincide con el de `os-maven-plugin`; los perfiles lo resuelven en cualquier máquina. |
| `Lanzador` neutro (no extiende `Application`) | Evita el error "JavaFX runtime components are missing" al ejecutar el fat-JAR. |
| Refresco transparente de token en `ClienteHttp` | Ante un 401 renueva la pareja contra `/auth/refresh` y reintenta una vez; replica el patrón del interceptor de Android. |

### Verificación local

```bash
# 1. Backend contra BBDD remotas
cd backend && npx prisma generate && npm run seed && npm run dev   # crea admin del seed

# 2. Tests
cd backend && npm test          # 114/114
cd ../desktop-admin && mvn test # 14/14 (TestFX incluido)

# 3. App de escritorio
cd desktop-admin && mvn javafx:run     # login con el admin del seed
#    GALICIAWEAR_API_URL=<url> mvn javafx:run  para apuntar a otro backend

# 4. Empaquetado
./empaquetar.sh                 # instalador nativo en dist/
```

### Preguntas probables del tribunal — Fase 5

1. **¿Por qué JavaFX y no Swing, si la rúbrica pide "mínimo Swing"?**
   > JavaFX es el sucesor oficial de Swing desde Java 8. Aporta separación real vista/lógica con
   > FXML declarativo (como XML+controlador), estilos con CSS, gráficos integrados (`PieChart`) y
   > binding de propiedades. Con Swing tendría que construir la UI imperativa en Java, mezclando
   > presentación y lógica. Empaqueto con `jpackage` un instalador nativo, igual que una app de
   > escritorio profesional. Cumple el mínimo de la rúbrica superándolo ampliamente.

2. **¿Cómo evitas congelar la ventana al llamar a la API?**
   > Ninguna llamada HTTP corre en el JavaFX Application Thread. Las envuelvo en `Task` (vía
   > `EjecutorTareas`, con un pool de hilos demonio) y el dashboard usa un `ScheduledService` que
   > repite la petición cada 15 s en un hilo aparte. Los resultados vuelven a la UI en los callbacks
   > `setOnSucceeded`/`setOnFailed`, que JavaFX garantiza que se ejecutan en el hilo de la interfaz.
   > Así la ventana sigue respondiendo aunque el servidor tarde.

3. **El panel necesita ver pedidos, diseñadores pendientes y logs, pero esos endpoints no existían
   con scope admin. ¿Qué hiciste?**
   > Añadí cinco endpoints `/admin/*` que reutilizan la lógica existente pero saltándose las
   > restricciones de propiedad/rol pensadas para cliente o diseñador. Por ejemplo, el listado
   > público de diseñadores fuerza `validado:true`; el de admin añade un `listarTodos` con el filtro
   > opcional para poder ver y validar los pendientes. El visor de logs lee la colección
   > `activity_logs` de MongoDB a través de la API, demostrando el uso real de la BBDD NoSQL desde
   > el panel sin acoplarlo a Mongo directamente.

---

---

## Fase 6 — Sistema de notificaciones extremo a extremo ✅

- **Última actualización**: 2026-06-08.
- **Rama**: `main`.

Notificaciones de pedidos y mensajes con tres capas: **persistencia + bandeja in-app**
(historial, contador de no leídas, marcar leídas), **entrega en tiempo real** reutilizando el
gateway Socket.IO del chat, y **push FCM best-effort** (cableado pero documentado como stub).

### Parte A — Backend

**Módulo nuevo `src/modulos/notificaciones/` (6 archivos):**

| Archivo | Función |
|---------|---------|
| `repositorio.ts` | Acceso Mongo a `NotificacionLog`: `crear`, `listarDe`, `contarNoLeidas`, `marcarLeida`, `marcarTodasLeidas`, `guardarFcmMessageId`. Acota todo por `destinatarioId`. |
| `servicio.ts` | **Helper único** `crear({destinatarioId, tipo, titulo, cuerpo, datos})` → persiste + emite `nueva_notificacion` a `usuario:<sub>` + push FCM best-effort. Degrada con elegancia (loguea y sigue) si Mongo/socket caen. Mapea a DTO estable. |
| `dto.ts` | Zod de paginación (`pagina`, `limite`). |
| `controlador.ts` · `rutas.ts` | 4 endpoints con `verificarJwt`. |
| `fcm.ts` | Push best-effort: `firebase-admin` con import dinámico perezoso (activado por `FIREBASE_SERVICE_ACCOUNT`). Limpia tokens caducados. Nunca lanza. |
| `tokens.ts` + `mongo/esquemas/deviceToken.ts` | Tokens FCM en colección Mongo `device_tokens` (sin migración Prisma). |

**Endpoints (todos JWT):**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET   | `/notificaciones` | Bandeja paginada → `{ notificaciones, total }` |
| GET   | `/notificaciones/contador` | No leídas → `{ noLeidas }` (para el badge) |
| PATCH | `/notificaciones/:id/leer` | Marca una leída → 204 |
| PATCH | `/notificaciones/leer-todas` | Marca todas → `{ actualizadas }` |
| PUT   | `/usuarios/yo/fcm-token` | Registra token FCM del dispositivo (best-effort) → 204 |

**Gateway Socket.IO** (`tiempoReal/servidorSockets.ts`): al conectar, `socket.join('usuario:'+sub)`
(sala personal, sin tocar la lógica de chat). El servicio emite con
`io.to('usuario:'+destinatarioId).emit('nueva_notificacion', dto)`.

**Triggers (todos fire-and-forget, no bloquean la request):**

| Origen | Evento → destinatario |
|--------|----------------------|
| `pedidos/servicio.ts` checkout | PEDIDO_CREADO → cada diseñador con línea |
| `pedidos/servicio.ts` pagar | PEDIDO_PAGADO → cada diseñador |
| `pedidos/servicio.ts` aceptar | PEDIDO_ACEPTADO → cliente |
| `pedidos/servicio.ts` cancelar | PEDIDO_CANCELADO → diseñadores |
| `envios/servicio.ts` actualizar | PEDIDO_ENVIADO / PEDIDO_ENTREGADO → cliente |
| `chat/servicio.ts` enviar | MENSAJE_NUEVO → destinatario (una por mensaje) |

*(RESENA_RECIBIDA queda soportado en el helper pero sin trigger: no existe módulo de reseñas.)*

**Tests nuevos (2 suites): 129/129 verdes** (antes 114; +15 casos en total con las fases previas).

| Suite | Tests | Cubre |
|-------|-------|-------|
| `notificaciones.rutas.test.ts` | 6 | `servicioNotificaciones.crear` (persiste + emite + degrada sin Mongo) y las 4 rutas con `verificarJwt` |
| `notificaciones.socket.test.ts` | 1 | Recepción de `nueva_notificacion` en la sala `usuario:<id>` |

Se mockeó la capa de notificaciones en los tests de pedidos/chat/envíos para que los triggers
no toquen Mongo (sin warnings de handles abiertos). `npx tsc --noEmit` limpio.

### Parte B — Android

| Capa | Clases / recursos |
|------|-------------------|
| DTOs | `DtoNotificacion`, `DtoEnvoltorioNotificaciones`, `DtoContadorNotificaciones`, `DtoPeticionTokenFcm` |
| API | 5 endpoints añadidos a `ServicioApi` (listar, contador, leer, leer-todas, fcm-token) |
| Repositorio | `RepositorioNotificaciones` (@Singleton): bandeja, contador, marcar, token FCM |
| Tiempo real | `RepositorioChat.nuevaNotificacion` + listener `nueva_notificacion` (mismo socket autenticado) |
| ViewModel | `ModeloVistaNotificaciones` (REST + tiempo real) |
| UI bandeja | `FragmentoNotificaciones` cableado (lista, vacío, marcar leída + navegación por tipo) dentro de `ActividadNotificaciones` (toolbar + "marcar todas"), `AdaptadorNotificaciones` + `item_notificacion.xml` |
| Entrada + badge | Campana con badge de no leídas en la barra de `FragmentoInicio` (`accion_campana.xml`, `menu_inicio.xml`); abre la bandeja, conecta el socket y refresca el contador en `onResume` y en tiempo real |
| FCM | `ServicioFcm.onNewToken` → `PUT /usuarios/yo/fcm-token`; `onMessageReceived` con deep-link según `data.tipo` |

**Navegación por tipo**: PEDIDO_* → `ActividadDetallePedido` (`EXTRA_PEDIDO_ID`);
MENSAJE_NUEVO → `ActividadChat` (`EXTRA_DISENADOR_ID` + nombre).

**Compilación**: `:app:assembleDebug` **BUILD SUCCESSFUL** con el JBR de Android Studio.

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| Tiempo real = el mismo socket del chat (sala `usuario:<sub>`) | Entrega a cualquier dispositivo conectado sin depender de FCM. Es el **camino fiable** de la demo. |
| Punto único de creación (`servicioNotificaciones.crear`) | Todos los triggers pasan por un helper que persiste + emite + push; un solo sitio que mantener y testear. |
| Triggers fire-and-forget | Si Mongo o el socket fallan, el pedido/mensaje se completa igual (sin 500). Tolerancia a Mongo caído. |
| Tokens FCM en Mongo `device_tokens` (no columna Prisma) | Evita una migración sobre el MySQL remoto; el push es opcional. |
| `firebase-admin` con import dinámico perezoso | El backend no depende de él en compilación ni arranque; si no hay `FIREBASE_SERVICE_ACCOUNT` o no está instalado, el push se omite sin error. |
| Campana + badge en Inicio (no 6ª pestaña) | La barra inferior ya tiene 5 pestañas; un icono en la barra superior con badge es menos invasivo. |

### Caveat FCM (estado real)

`android/app/google-services.json` es un **STUB** (`project_number 000000000000`), así que el
**push real NO llega**. El camino fiable es **in-app + Socket.IO**, que sí entrega en tiempo real.
Para activar push real hace falta un proyecto Firebase real (`google-services.json` real en la app
+ service account en `FIREBASE_SERVICE_ACCOUNT` del backend); todo el camino queda cableado.

### Verificación local

```bash
# Backend
cd backend && npx tsc --noEmit        # limpio (ignora TS6059 preexistentes de /tests)
npm test                              # 129/129 verdes
npm run dev                           # Mongo conectado

# Android (con el JBR de Android Studio)
cd ../android && ./gradlew :app:assembleDebug \
  -Dorg.gradle.java.home="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Prueba end-to-end (backend + emulador):
# Pedido: cliente crea y paga → el diseñador conectado recibe badge +1 (Nuevo pedido/Pedido pagado);
#         acepta → el cliente recibe PEDIDO_ACEPTADO; al tocarla abre el detalle y queda leída (badge -1).
# Chat:   enviar un mensaje → el destinatario recibe MENSAJE_NUEVO que abre el chat con ese interlocutor.
```

### Preguntas probables del tribunal — Fase 6

1. **¿Por qué reutilizas el socket del chat para las notificaciones en vez de un canal aparte?**
   > El socket del chat ya está autenticado con el mismo JWT y ya gestiona reconexión y ciclo de
   > vida. Al conectar, el servidor une cada socket a una sala personal `usuario:<sub>` además de las
   > salas de chat 1:1. Emitir una notificación es `io.to('usuario:'+id).emit('nueva_notificacion', …)`,
   > que llega a **cualquier dispositivo conectado** de ese usuario. Crear un segundo socket
   > duplicaría handshakes, tokens y reconexiones sin ningún beneficio.

2. **Si MongoDB se cae, ¿se rompe el checkout o el envío de un mensaje?**
   > No. El helper `servicioNotificaciones.crear` está envuelto en try/catch y los triggers lo llaman
   > fire-and-forget (`void crear(...)`). Si la persistencia en Mongo falla, se loguea un warning y la
   > función devuelve `null`; el pedido o el mensaje se completan igual. La notificación es un efecto
   > secundario, nunca parte del contrato transaccional. Es el mismo principio que la auditoría
   > fire-and-forget de la Fase 3.

3. **El push FCM no funciona en la demo. ¿Por qué lo implementas entonces?**
   > Porque el requisito de "notificaciones en tiempo real" lo cubre de forma fiable el camino in-app
   > + Socket.IO, que sí funciona. El push FCM queda **cableado de extremo a extremo** (token del
   > dispositivo → `PUT /usuarios/yo/fcm-token` → Mongo `device_tokens`; envío con `firebase-admin`;
   > deep-link en `onMessageReceived`) pero degradado a best-effort porque `google-services.json` es
   > un stub. Activar el push real es solo configuración (proyecto Firebase + service account), sin
   > tocar código. Así demuestro la arquitectura completa sin depender de credenciales externas.


---

## Fase 6 — Web GaliciaWear (storefront + dashboard de diseñador) ✅

- **Última actualización**: 2026-06-08.
- **Rama**: `main`.

> Nota de numeración: el bloque anterior, «Sistema de notificaciones extremo a extremo», fue un
> **interludio transversal** (backend + Android) que quedó etiquetado también como Fase 6. Esta
> sección es la entrega real de la **fila 6 del roadmap**: la web completa.

La web (`web/`) pasa de ser el cascarón de Fase 0 a un **storefront público + zona de cuenta +
dashboard del diseñador** funcional contra la API REST existente, con un acabado editorial
(«Atlántico editorial sostenible») coherente con la app Android y el panel JavaFX.

### Stack y dependencias añadidas (mínimas y justificadas)

| Dependencia | Para qué |
|-------------|----------|
| `@tanstack/react-query` | Fetching/caché/estados (cargando/error/vacío) declarativos + invalidación tras mutaciones; carrito optimista. |
| `framer-motion` | Transiciones de página, reveals al hacer scroll, micro-interacciones; todo respeta `prefers-reduced-motion`. |
| `lucide-react` | Iconografía SVG coherente. |
| `clsx` + `tailwind-merge` | Helper `cx()` para componer clases sin conflictos. |
| `@fontsource-variable/{fraunces,manrope,inter}` | 3 fuentes variables **self-hosted** (offline, sin FOUT), importadas en `main.tsx`. |
| `@types/node` (dev) | Tipos para `vite.config.ts` (`node:path`, `__dirname`). |

*(Socket.IO en cliente queda como mejora futura: el badge de notificaciones se refresca por sondeo
cada 30 s con React Query, robusto y offline-friendly para la defensa.)*

### Estructura (`web/src/`, ~91 archivos fuente + 4 de test, identificadores en castellano)

| Carpeta | Archivos | Contenido |
|---------|---------:|-----------|
| `api/` | 16 | `clienteApi.ts` (Bearer + refresh-on-401 con cola single-flight), `tipos.ts`, `clienteConsultas.ts` (QueryClient), `endpoints/*` (11 dominios) |
| `contexto/` | 3 | `ContextoSesion` (tokens + login/registro/logout + rehidratación), `ContextoCarrito` (reactivo + optimista) |
| `hooks/` | 9 | `usarSesion`/`usarCarrito` (vía contexto), `usarCatalogo`, `usarPedidos`, `usarNotificaciones`, `usarCuenta`, `usarPanelDisenador`, `usarMovimientoReducido`, `usarDebounce`, `usarClicFuera`, `usarTitulo` |
| `componentes/ui/` | 14 | Sistema de diseño: Boton/EnlaceBoton, Campo/CampoArea/Selector, Tarjeta, Chip, Insignia, Avatar, Esqueleto, EstadoVacio, Paginador, Modal, Cajon, Brindis (toasts), Spinner |
| `componentes/disposicion/` | — | BarraNavegacion (con carrito+campana+menú), PieDePagina, ContenedorPagina, DisposicionPrincipal (transición por ruta), DisposicionCuenta/DisposicionPanel, NavLateral, Marca, Revelar, EncabezadoPagina, Buscador, CampanaNotificaciones, MenuUsuario |
| `componentes/catalogo/` | — | TarjetaProducto, RejillaProductos (stagger + esqueletos), BarraFiltros, ChipsCertificados, TarjetaDisenador |
| `paginas/` | 19 | `publicas/` (Inicio, Catalogo, DetalleProducto, Carrito, Checkout, Login, Registro, Disenadores, DetalleDisenador, NoEncontrado) · `cuenta/` (MiPerfil, MisDirecciones, MisPedidos, DetallePedido) · `disenador/` (PanelDisenador, MisPrendas, EditarPrenda, PedidosRecibidos, PerfilMarca) |
| `rutas/` | 4 | Router (data router + lazy), guardas `RutaProtegida` y `RutaDisenador`, `PantallaCargando` |
| `util/` | 5 | `cx`, `formatos` (precio €, fechas, tiempo relativo, slug), `constantes` (enums→etiquetas), `validacion` (espejo de las reglas zod), `imagenes` (archivo→data URI con reescalado) |

### Sistema de diseño — «Atlántico editorial sostenible»

- **3 tipografías**: Fraunces (`font-editorial`, títulos hero), Manrope (`font-display`, UI/CTAs),
  Inter (`font-sans`, cuerpo). `tailwind.config.ts` ampliado **sin romper Fase 0**: escalas
  atlantic/galego/sand 50–950, neutros cálidos (tinta/piedra), semánticos (exito/aviso/peligro/info),
  `borderRadius.xl2`, sombras (suave/tarjeta/flotante), easing `suave`, keyframes (aparecer/subir/
  brillo/latido/marquesina) y `darkMode: 'class'`.
- `index.css` `@layer base`: scroll suave, `::selection` atlántico, scrollbar fina, `:focus-visible`
  con anillo atlantic-500, `text-wrap: balance` en titulares y `@media (prefers-reduced-motion)` que
  neutraliza animaciones.
- `favicon.svg` con la marca (olas atlánticas + hoja).

### Capa de datos y sesión

- **`clienteApi.ts`**: base `/api`, inyección de `Authorization`, **refresh-on-401 con cola de una
  sola renovación concurrente** (single-flight) y error tipado `ErrorApi { estado, codigo, mensaje }`.
  Cierre forzado si el refresco falla (notifica al `ContextoSesion`).
- **Tokens**: acceso en memoria; refresco en `localStorage` para persistir sesión entre recargas.
  Al arrancar, si hay refresco, se rehidrata con `GET /auth/yo` (renovando si hace falta).
- **React Query** para todo GET (claves por dominio, `staleTime` 30 s) con invalidación tras
  mutaciones; **carrito optimista** (cantidad/eliminación instantáneas con rollback y brindis).
- Guardas de ruta `RutaProtegida` y `RutaDisenador` (redirige a `/login?destino=…`).

### Flujos cubiertos

- **Cliente**: navegar catálogo → filtrar (búsqueda con debounce, material, ciudad, slider de km,
  chips de certificados, filtros en la URL) → detalle (galería, variante, certificados, sostenibilidad)
  → añadir al carrito (badge con micro-pop) → checkout (dirección + método de pago + simulación de
  pago) → ver pedido con estado y seguimiento → cancelar; cuenta (perfil con foto base64, contraseña,
  preferencias eco, direcciones CRUD + principal); campana de notificaciones con contador.
- **Diseñador**: panel con KPIs y aviso de marca; CRUD de prendas con variantes e imágenes (subida
  base64 → `/uploads`), publicar/retirar; pedidos recibidos (aceptar líneas, gestionar envío:
  transportista, seguimiento, marcar enviado/entregado); perfil de marca (solicitar/editar).

### Hallazgos sobre el contrato (corregidos respecto al enunciado)

| Detalle real del backend | Acción en la web |
|--------------------------|------------------|
| Las rutas REST se montan en la raíz (`/productos`, `/auth`…), **no bajo `/api`** | El proxy dev de Vite se amplió con `rewrite` que elimina `/api` (nginx ya lo hacía en prod). |
| Listados → `{ datos, total, pagina, limite }` (no `{ productos }`); paginación con `limite` (no `tamano`) | Tipos y endpoints siguen el shape real. |
| Campos `Decimal` (precio, ajuste, totales) llegan **como string** | `aNumero()`/`formatoPrecio()` los normalizan; nunca se opera con strings. |
| Actualizar perfil cliente es `PATCH /usuarios/yo/cliente` (no `/usuarios/yo`) | Endpoint corregido. |
| El catálogo público **no filtra por diseñador** | El perfil del diseñador pide las prendas de su ciudad y filtra por `disenadorId` en cliente. |
| Notificaciones de Mongo usan clave `_id` (no `id`) | Tipo `Notificacion` con `_id`. |

### Tests (Vitest + Testing Library): 10/10 verdes

| Suite | Tests | Cubre |
|-------|------:|-------|
| `api/clienteApi.test.ts` | 3 | Bearer + cuerpo parseado, refresh-on-401 con reintento único, cierre forzado si el refresco falla |
| `contexto/ContextoSesion.test.tsx` | 2 | login/logout (estado) y guarda `RutaProtegida` que redirige a `/login` |
| `componentes/catalogo/TarjetaProducto.test.tsx` | 1 | nombre/marca/precio formateado/certificado + enlace al detalle |
| `componentes/catalogo/BarraFiltros.test.tsx` | 4 | búsqueda, material, chip de certificado y limpiar filtros |

Se retiró el `App.test.tsx` placeholder de Fase 0 (y el `App.tsx`: `main.tsx` monta el router).

### Decisiones técnicas destacables

| Decisión | Por qué |
|----------|---------|
| Tokens: acceso en memoria, refresco en `localStorage` | Equilibrio sesión-persistente / superficie XSS; se documenta el trade-off y se evita pintar HTML de terceros. |
| Refresh single-flight con cola | Varias peticiones que caducan a la vez comparten **una** renovación; evita rotaciones de token en carrera (el refresh revoca el anterior). |
| Filtros del catálogo en la URL | Enlaces compartibles y atrás/adelante coherentes; el debounce se aplica a la **consulta**, no al input (inputs siempre responsivos). |
| Badge de notificaciones por sondeo (30 s) en vez de Socket.IO | Robusto y sin dependencia extra para la defensa; el backend ya soporta tiempo real como mejora futura. |
| `react-hooks/rules-of-hooks` desactivada en ESLint | El plugin detecta hooks por el prefijo inglés `use`; con la regla de identificadores en castellano (`usar*`) daba falsos positivos. Se mantiene `exhaustive-deps`. |
| Páginas con `React.lazy` | El bundle se divide por ruta (chunk principal ~139 KB gzip); primera carga más rápida. |
| Subida de imágenes a data URI con reescalado en canvas | Igual que la app Android; el backend guarda el archivo en `/uploads` y devuelve la URL. |

### Verificación local

```bash
cd web
npm run build      # tsc -b + vite build, sin errores (TS estricto) ✅
npm run lint       # eslint --max-warnings=0 → 0 warnings ✅
npm test           # vitest → 10/10 verdes ✅

# End-to-end contra el backend real (mismo origen, sin CORS):
cd ../backend && npm run dev          # MySQL/Mongo + seed
cd ../web && npm run dev              # proxy /api → localhost:3000 (rewrite quita /api)
# Cuentas del seed en TESTING_ACCOUNTS.md (ana@…, linares@…, contraseña Prueba123).
```

### Preguntas probables del tribunal — Fase 6 (Web)

1. **¿Cómo mantienes la sesión y qué pasa cuando caduca el access token (15 min)?**
   > El access token vive en memoria y el refresco en `localStorage`. Toda petición lleva el Bearer;
   > si la API responde 401, el `clienteApi` renueva la pareja contra `/auth/refresh` y **reintenta una
   > vez**. Si varias peticiones caducan a la vez, una **cola single-flight** garantiza una sola
   > renovación (el refresh rota y revoca el anterior, así que renovar en paralelo cerraría la sesión).
   > Si el refresco falla, se fuerza el cierre. Al recargar la página, si hay refresco persistido se
   > rehidrata con `GET /auth/yo`. Replica el `InterceptorJwt` de Android y el `ClienteHttp` del panel.

2. **El backend devuelve los precios como string y los listados envueltos de forma distinta a lo
   esperado. ¿Cómo lo resolviste?**
   > Verifiqué el contrato leyendo los controladores/repositorios reales, no la documentación. Los
   > `Decimal` de Prisma se serializan como string, así que los tipo como `string` y los convierto con
   > `aNumero()`/`formatoPrecio()` en la capa de presentación; nunca opero con strings. Los listados
   > vienen como `{ datos, total, pagina, limite }`, no `{ productos }`, y el parámetro de tamaño es
   > `limite`: los tipos y las funciones de endpoint siguen el shape real, no el supuesto.

3. **¿Por qué identificadores en castellano si chocan con herramientas como react-hooks?**
   > Es el lenguaje ubicuo del dominio (regla de oro del proyecto): `usarSesion`, `BarraFiltros`,
   > `clienteApi`. El plugin `eslint-plugin-react-hooks` detecta los hooks por el prefijo inglés `use`
   > con una regex fija, así que no reconoce `usar*` y marca falsos positivos de orden de hooks.
   > Desactivo **solo** `rules-of-hooks` (documentado en `.eslintrc`) y mantengo `exhaustive-deps`,
   > que sí valida dependencias independientemente del nombre.

4. **¿Cómo consigues que la web «se sienta» como la app Android siendo otra tecnología?**
   > Comparten la **identidad atlántica** (misma paleta atlantic/galego/sand del Material 3 de Android)
   > y el mismo modelo de dominio y contrato REST. La web añade un alma editorial con Fraunces y
   > micro-interacciones con framer-motion, todas con respeto a `prefers-reduced-motion`. Misma marca,
   > distinto medio.

---

### Ampliaciones posteriores de Fase 6 (acabado de marca, chat y correcciones)

Tras el build inicial de la web, se iteró sobre acabado visual, marca, una funcionalidad nueva
(chat) y varias correcciones transversales. **Verificación tras cada cambio: `npm run build` +
`npm run lint` (0 warnings) + `npm test` (10/10) en verde.**

| Cambio | Detalle |
|--------|---------|
| **Identidad clonada de Android** (sustituye la dirección "editorial Fraunces") | La web ahora replica 1:1 el tema Material `Tema.GaliciaWear`: tipografía **Syne** en todo (self-hosted), paleta **exacta** de `res/values/colors.xml` (azul atlántico `#0A5CA8` + celeste `#29A9E0`, fondo frío `#F2F8FD`, tinta marino, teal sostenible), botones 16dp (rectángulo, no píldora), tarjetas 18dp, chips 12dp, degradados azul→celeste. Tokens Tailwind remapeados conservando los nombres (atlantic/galego/sand/tinta/piedra) → recoloreado en cascada sin tocar componentes. |
| **Logo de marca real (vieira gallega)** | Kit oficial (icono cuadrado + wordmark "GALICIAWEAR", en blanco y negro). Recortado con PIL a su contenido. Web: navbar/pie (wordmark negro), login/registro (icono), favicon + apple-touch (vieira blanca sobre azulejo `#0A5CA8`). Android: splash y cabecera de login (vieira **blanca** sobre degradado), "diseñador pendiente" (negra), y **adaptive icon del lanzador** (primer plano vieira blanca + fondo degradado, legacy webp recompuestos). |
| **Fotos subidas desde Android no cargaban en web** | El backend guardaba la URL **absoluta** con el host del subidor (`http://10.0.2.2:3000/uploads/...`), inalcanzable desde el navegador. Se añadió `resolverImagen()` que normaliza cualquier `/uploads/...` a ruta **relativa** (pasa por el proxy); repara también las filas ya guardadas. + `location /uploads/` en nginx. |
| **Subir foto arrastrando** (alta de prenda) | Zona drag-and-drop en `EditarPrenda` (arrastrar o clic), **subida múltiple** en serie, resalte al arrastrar, spinner; la primera imagen queda como principal. |
| **Error 429 al crear prenda** | El límite global (100 pet./15 min/IP) era irrisorio para un SPA. Subido a **1000** y se **excluye** del conteo `/uploads` y `/salud` (una página con muchas imágenes no agota el cupo de la API). |
| **Android: header bajo la barra de estado** | Con targetSdk 35 el edge-to-edge es forzado. Patrón Material: `fitsSystemWindows` en `CoordinatorLayout`+`AppBarLayout`, degradado movido al AppBarLayout y toolbar transparente → el degradado va detrás de la barra (iconos blancos) y el título baja sin chocar. |
| **Android: menú de diseñador** | Para cuentas DISEÑADOR, el ítem central del `BottomNavigationView` deja de ser "Carrito" y pasa a **"Añadir prenda" con icono "+"** (lanza `ActividadEditarPrenda` en modo crear, sin cambiar de pestaña); el diseñador no carga su carrito. |
| **Chat en la web (tiempo real)** | Chat de soporte cliente↔tienda reutilizando el backend de Android: REST (`/chat/conversaciones`, `/chat/:peerId/mensajes`, `/chat/:peerId/leer`) + **Socket.IO** (`socket.io-client`, proxy `/socket.io` con `ws` en Vite y nginx, JWT en el handshake). Bandeja + hilo responsive (`/mensajes`, `/mensajes/:peerId`), envío por `enviar_mensaje` con eco `nuevo_mensaje`, badge de no leídos, botones **"Contactar"** en detalle de prenda y de diseñador, y deep-link de la campana para `MENSAJE_NUEVO`. El socket se cierra al cerrar sesión. |

**Estado de Fase 6: COMPLETA y cerrada.** La web cubre storefront + cuenta + dashboard de
diseñador + chat, con identidad de marca unificada en web y Android.
