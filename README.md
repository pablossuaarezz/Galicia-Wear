# GaliciaWear

> **Plataforma e-commerce multiplataforma de moda sostenible gallega.**
> Proyecto Fin de Ciclo · Desarrollo de Aplicaciones Multiplataforma (DAM) · 2024-26.

![Status](https://img.shields.io/badge/status-fase%202a%20%E2%9C%85-blue)
![Stack](https://img.shields.io/badge/stack-Node%20%2B%20React%20%2B%20Android%20%2B%20JavaFX-1e6fa3)
![License](https://img.shields.io/badge/license-MIT-green)
![Linux-first](https://img.shields.io/badge/Linux--first-yes-success)
![Idioma](https://img.shields.io/badge/c%C3%B3digo-castellano-orange)

GaliciaWear es un **marketplace de moda sostenible local** que conecta a diseñadores
gallegos con consumidores jóvenes (18-35 años) en A Coruña y Galicia. Ofrece filtros por
certificados sostenibles (GOTS, OEKO-TEX, km 0), envíos ecológicos vía Correos verde,
chat directo con el diseñador y un probador de prendas con realidad aumentada.

## Diferenciadores validados con entrevistas (Fases 0-2 de la propuesta emprendedora)

- Filtros por **sostenibilidad** (materiales reciclados, km 0, certificados).
- Foco **100% en diseñadores gallegos** (no fast fashion global).
- **Envíos eco** (Correos verde, recogida en punto).
- **Realidad aumentada** para probar prendas (mencionado por Carlos en entrevista 2).
- **Comunidad y reseñas reales** (mencionado por Laura).
- **Recomendaciones personalizadas** por preferencias eco (mencionado por María).

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| **App móvil** | Java + Android Studio (nativo) — Material Design 3, MVVM, Room, Retrofit |
| **API REST** | Node.js 20 + Express + TypeScript + Prisma + Socket.IO |
| **Web cliente / diseñador** | React + Vite + TypeScript + TailwindCSS |
| **Panel admin** | JavaFX 21 + Maven (empaquetado con `jpackage` → `.deb` / `.AppImage`) |
| **BBDD relacional** | PostgreSQL 16 |
| **BBDD NoSQL** | MongoDB 7 (logs, reseñas con multimedia, recomendaciones) |
| **Notificaciones push** | Firebase Cloud Messaging |
| **Tiempo real** | Socket.IO (chat cliente↔diseñador, sociales en tiempo real) |
| **CI/CD** | GitHub Actions (lint + test) |
| **Contenedores** | Docker + Docker Compose |
| **Testing** | Jest (backend), Vitest (web), JUnit 5 + Mockito + Espresso (Android), TestFX (JavaFX) |

---

## Arquitectura

```
┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────┐
│  Android (Java)   │  │   Web (React)     │  │  Desktop (JavaFX)   │
│  Cliente          │  │  Cliente +        │  │  Panel admin        │
│                   │  │  Dashboard diseñ. │  │                     │
└────────┬──────────┘  └────────┬──────────┘  └──────────┬──────────┘
         │ HTTPS/JWT             │ HTTPS/JWT              │ HTTPS/JWT
         │ + Socket.IO           │ + Socket.IO            │ + WebSocket
         ▼                       ▼                        ▼
                ┌─────────────────────────────────────┐
                │      API REST (Node + Express)      │
                │  Controller → Service → Repository  │
                │  Auth JWT · RBAC · zod · Socket.IO  │
                └────┬──────────────────────────┬─────┘
                     ▼                          ▼
           ┌─────────────────┐         ┌──────────────────┐
           │  PostgreSQL 16  │         │     MongoDB 7    │
           │  (núcleo)       │         │  (logs/reseñas)  │
           └─────────────────┘         └──────────────────┘
```

---

## Arranque rápido (Linux)

> Requisitos: Docker + Docker Compose, Node 20+, JDK 17+, Android Studio (sólo Fase 4+).

```bash
# 1. Clona y entra
git clone <repo> && cd "Galicia Wear"

# 2. Copia variables de entorno
cp .env.example .env

# 3. Levanta BBDD + servicios
bash scripts/start-dev.sh

# 4. Backend (terminal aparte)
cd backend && npm install && npm run dev
# → http://localhost:3000/health

# 5. Web (terminal aparte)
cd web && npm install && npm run dev
# → http://localhost:5173
```

**O todo con Docker Compose** (a partir de Fase 2):

```bash
docker compose up --build
# Web   → http://localhost:8080
# API   → http://localhost:3000
```

---

## Estructura del monorepo

```
Galicia Wear/
├── backend/          API Node + Express + TypeScript
├── web/              React + Vite + Tailwind (storefront + dashboard diseñador)
├── android/          App Android Java nativa (Fase 4)
├── desktop-admin/    JavaFX panel admin (Fase 5)
├── database/         schema.prisma + seed.ts + migrations/
├── scripts/          start-dev.sh, backup.sh, restore.sh
├── docs/
│   ├── uml/          Diagramas PlantUML + Mermaid (Fase 1)
│   ├── api/          Swagger + colección Postman (Fase 2)
│   ├── memoria/      Fragmentos para la memoria DAM (Fase 8)
│   └── AI_USAGE.md   Uso ético de IA (rúbrica apdo. 7)
├── .github/workflows/ci.yml
├── docker-compose.yml
├── PROGRESS.md       Bitácora viva de fases
└── README.md
```

---

## Compatibilidad Linux

Cumple el requisito explícito de la rúbrica DAM:
- Todos los scripts son `bash` con `set -euo pipefail` y entrecomillan rutas.
- Backend y web corren en contenedores `alpine` sin dependencias propietarias.
- JavaFX se empaqueta con `jpackage` → `.deb` (Debian/Ubuntu) y `.AppImage` (universal).
- CI corre en `ubuntu-latest` en GitHub Actions.

---

## Roadmap de fases

Ver [PROGRESS.md](./PROGRESS.md) para el estado vivo.

| Fase | Estado | Descripción |
|------|--------|-------------|
| 0 | ✅ | Inicialización monorepo, Docker, CI, README |
| 1 | ✅ | Modelado UML + ER PostgreSQL (10 diagramas) |
| 2a | ✅ | Schema Prisma + infra backend (logger, errores, middlewares) + módulo **autenticación** + tests |
| 2b | ⏳ | Módulos `usuarios`, `disenadores`, `direcciones`, `certificados` |
| 2c | ⏳ | Módulos `productos`, `variantes`, `carritos` |
| 2d | ⏳ | Módulos `pedidos`, `envios`, `resenas`, `mensajes` |
| 2e | ⏳ | Socket.IO + workers + Swagger + seed |
| 3 | ⏳ | Persistencia avanzada: Mongo + backup.sh + import/export XML/JSON |
| 4 | ⏳ | App Android (10 pantallas, FCM, ARCore stub) |
| 5 | ⏳ | JavaFX admin + dashboard tiempo real + jpackage |
| 6 | ⏳ | Web completa (storefront + dashboard diseñador) |
| 7 | ⏳ | Seguridad transversal + cobertura ≥60% + CI completa |
| 8 | ⏳ | Documentación memoria + capturas + defensa oral |

---

## Licencia

MIT © 2026 Pablo Suárez · TFG DAM 2024-26.

Hecho con IA como pair-programmer ([docs/AI_USAGE.md](./docs/AI_USAGE.md)).
