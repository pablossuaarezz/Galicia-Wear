# Análisis del proyecto GaliciaWear — Ficha de realidad técnica

> Auditoría del código real del repositorio frente a las afirmaciones del
> `MEGAPROMPT_MEMORIA.md`. Objetivo: que la memoria del TFG sea **precisa** y
> resista las preguntas del tribunal. Fecha del análisis: 2026-06-14.

---

## 1. Qué es realmente el proyecto

GaliciaWear es un marketplace multiplataforma de moda sostenible gallega, **real y
sustancial**, no un esqueleto. Suma código verificado en cuatro frentes:

| Componente | Tecnología real | Tamaño (LOC) | Estado |
|------------|-----------------|-------------:|--------|
| Backend API | Node 20 + Express + TypeScript + Prisma + Socket.IO | ~6.700 | Maduro |
| App Android | Java nativo (Hilt, Room, Retrofit, FCM, MVVM) | ~9.570 | Maduro |
| Web | React 18 + Vite + TypeScript + TailwindCSS + React Query | ~8.440 | Maduro |
| Desktop admin | JavaFX 21 + Maven (FXML, MVC, OkHttp) | ~2.090 | Funcional |

Según `PROGRESS.md`, el estado global es **"Fase 6 completa"** (fases 0–6 cerradas).
Existe ya una memoria previa en `docs/memoria/Memoria_TFG_GaliciaWear_Pablo_Suarez.pdf`
(25 páginas).

---

## 2. Verificación de afirmaciones clave (megaprompt vs. código real)

### ✅ Afirmaciones CORRECTAS (puedes usarlas con confianza)

- **JWT**: access token `15m` + refresh token `7d` (`configuracion/entorno.ts`). ✔
- **bcrypt**: rondas configurables 10–15 (el megaprompt dice 12; el código permite el
  rango, por defecto cae en ese entorno). ✔ — verifica el valor exacto en `.env`.
- **Cifrado IBAN AES-256-GCM**: real, en `utilidades/cifrado.ts`, con IV de 96 bits. ✔
- **Helmet, CORS, rate limiting, Zod**: todos presentes en `aplicacion.ts`. ✔
- **Swagger/OpenAPI**: real (`configuracion/swagger.ts`, comentarios `@openapi`). ✔
- **Prisma como ORM (relacional) + Room en Android**: ✔
- **Socket.IO tiempo real** (chat + notificaciones) en backend, web y Android. ✔
- **Docker Compose** (mongo + backend + web) y **GitHub Actions CI** (jobs backend y
  web, lint + test, `ubuntu-latest`). ✔
- **UML**: 10 diagramas reales en `docs/uml/` (ER en `.mmd` y `.puml`, clases, despliegue,
  2 de secuencia, 3 de casos de uso). ✔ — el C20 y C15 que pide existen como fuente.
- **17 modelos Prisma** (Usuario, Cliente, Disenador, Direccion, TokenRefresco, Producto,
  Variante, ImagenProducto, CertificadoSostenibilidad, CertificadoDeProducto, Carrito,
  ItemCarrito, Pedido, LineaPedido, Envio, Resena, Mensaje). ✔

### ⚠️ Discrepancias a CORREGIR antes de redactar

| # | Afirmación del megaprompt | Realidad del código | Acción |
|---|---------------------------|---------------------|--------|
| 1 | **PostgreSQL 16** + `pg_dump` en backup | El provider de Prisma es **MySQL** (`provider = "mysql"`, justificado como servidor del centro) y `backup.sh` usa **`mysqldump`** | Usa **MySQL** en toda la memoria. La nota interna del megaprompt ("actúa como MySQL") ya apunta a esto, pero su cuerpo dice PostgreSQL/pg_dump: es falso. |
| 2 | **~188 archivos de test** | ~**47 archivos** de test; ~**295 casos** (249 backend + 16 web + 16 Android + 14 desktop) | Di "**~295 casos de prueba en ~47 archivos**". Es más impresionante y es cierto. |
| 3 | **16 módulos** backend | **15 módulos**: admin, autenticacion, carrito, certificados, chat, direcciones, disenadores, envios, imagenes, **mongo**, notificaciones, pedidos, productos, usuarios, variantes | Ajusta a 15. "resenas" y "mensajes" son **modelos**, no módulos sueltos (reseñas viven con productos; mensajes con chat). |
| 4 | MongoDB con **4 colecciones** | **6 colecciones**: `anonymous_carts`, `recommendations`, `activity_logs`, `notification_logs`, `review_media`, `device_tokens` | Lista las 6. |
| 5 | Android: **15 pantallas** | **16 Actividades** + **9 Fragmentos** + 39 layouts | Di "16 actividades y 9 fragmentos". |
| 6 | **README/PROGRESS** dicen PostgreSQL | El código real es MySQL | Inconsistencia **dentro del propio repo**: si el tribunal abre el README verá "PostgreSQL 16". Conviene unificar a MySQL. |
| 7 | FCM "stub integrable" | Existe `ServicioFcm.java` + colección `device_tokens` + DTO de token | Es **parcial pero real**: descríbelo como "integración de FCM con registro de tokens; envío push como punto de extensión", no como simple stub. |

### ℹ️ Inconsistencias menores de datos de portada

- **Curso**: el megaprompt dice `2025/2026`; README/abstract dicen `2024/25` y `2024-26`.
  Elige uno (probablemente **2025/2026** si entregas en junio 2026).
- **Centro/Tutor**: el megaprompt da "CPR Plurilingüe karbo" y "Ramón Carrasco Borrego"
  pero a la vez pide dejar `[Centro]`/`[Tutor]` como placeholders. Decide y unifica.
- **Firma de la declaración de IA**: la plantilla pone "junio de 2025" pero la entrega es
  **junio de 2026**. Corrígelo.

---

## 3. Mapa real del código (para citar con precisión)

**Backend** (`backend/src/`): `aplicacion.ts`, `index.ts`, 15 módulos en `modulos/`,
`middlewares/`, `configuracion/` (entorno, swagger), `tiempoReal/` (Socket.IO),
`trabajadores/` (workers), `utilidades/` (cifrado). ~80 manejadores de ruta. Identificadores
en **castellano** (regla del proyecto, ver `CONVENCIONES.md`).

**Android** (`android/app/src/main/java/gal/galiciawear/app/`): arquitectura por capas
`datos/` (local Room + remoto Retrofit/DTOs + repositorios), `di/` (Hilt: ModuloBaseDatos,
ModuloRed, ModuloRepositorios), `fcm/`, `modelovista/` (MVVM). 16 Actividades incluyendo
Splash, Autenticacion, Principal, DetalleProducto, Checkout, Chat, Conversaciones,
Notificaciones, EditarPerfil, MisPrendas, EditarPrenda, PerfilDisenador.

**Web** (`web/src/`): 20 páginas en `paginas/` (publicas, cuenta, disenador, mensajes),
componentes, contextos, hooks, `tiempoReal/` (Socket.IO). React Query + Tailwind.

**Desktop** (`desktop-admin/src/`): 8 vistas FXML (login, principal, dashboard,
disenadores, productos, pedidos, logs, importexport) con controladores MVC, servicios y
`ClienteHttp` (OkHttp). Tests con TestFX.

**Datos**: `database/schema.prisma` (MySQL), 2 migraciones, `seed.ts`. Mongo en
`backend/src/modulos/mongo/esquemas/` (6 esquemas Mongoose).

**Scripts**: `backup.sh` (mysqldump + mongodump → `.tar.gz` con retención), `restore.sh`,
`start-dev.sh`.

---

## 4. Notas de coherencia para el tribunal

- **Historial git**: hay commits "Eliminar todas las referencias a IA del repositorio" y
  "Eliminar botón AR y todas las referencias a realidad aumentada". El código está limpio
  de IA y de la función AR descartada. La memoria (sección 7) sí declara el uso de IA: es
  coherente declararlo en la memoria aunque el repo no lo mencione, pero **no menciones AR**
  como funcionalidad existente.
- **Pasarela de pago**: no hay integración real (Stripe/Redsys). Correcto tenerlo solo en
  "líneas de mejora".
- **Capturas**: el megaprompt pide 20 (C01–C20). Las fuentes para C15 (ER), C16 (Mongo) y
  C20 (despliegue) ya existen en `docs/uml/` y en el esquema; solo hay que renderizarlas.

---

## 5. Veredicto

El proyecto **respalda** una memoria DAM sólida: cubre BBDD relacional + ORM, NoSQL,
XML/JSON, script de backup, OOP, GUI de escritorio, app móvil, app web, API REST,
WebSockets/tiempo real, seguridad + roles, multiplataforma, Linux, testing, UML y Git.
Las afirmaciones técnicas son en su mayoría verdaderas; las correcciones de la sección 2
(sobre todo **MySQL en vez de PostgreSQL** y el **recuento de tests**) son imprescindibles
para no introducir errores fácilmente refutables abriendo el repositorio.
