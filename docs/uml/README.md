# Diagramas UML — GaliciaWear

Esta carpeta contiene todos los diagramas exigidos por la rúbrica DAM 2024-26 en formato
**PlantUML** (`.puml`) y **Mermaid** (`.mmd`). Ambos formatos son texto plano y se versionan
en Git como código.

## Índice de diagramas

| # | Diagrama | Archivo(s) | Para qué contenido DAM |
|---|----------|------------|------------------------|
| 1 | Entidad-Relación (BBDD) | [`er-diagram.mmd`](./er-diagram.mmd), [`er-diagram.puml`](./er-diagram.puml) | BBDD relacional + ORM |
| 2 | Diagrama de clases del dominio | [`class-domain.puml`](./class-domain.puml) | POO (herencia, interfaces, genéricos) |
| 3 | Casos de uso — Cliente | [`usecase-cliente.puml`](./usecase-cliente.puml) | Análisis funcional |
| 4 | Casos de uso — Diseñador | [`usecase-disenador.puml`](./usecase-disenador.puml) | Análisis funcional |
| 5 | Casos de uso — Admin | [`usecase-admin.puml`](./usecase-admin.puml) | Análisis funcional + XML/JSON import/export |
| 6 | Secuencia — Compra completa | [`sequence-purchase.puml`](./sequence-purchase.puml) | API REST + transacciones + integración |
| 7 | Secuencia — Push tiempo real | [`sequence-push.puml`](./sequence-push.puml) | Sockets/hilos + notificaciones tiempo real + comunicación entre procesos |
| 8 | Despliegue | [`deployment.puml`](./deployment.puml) | Multiplataforma + Linux + Docker |

## Cómo renderizar los diagramas

### Opción A — Visor online (lo más rápido)
- **Mermaid**: pega el contenido de `.mmd` en https://mermaid.live
- **PlantUML**: pega el contenido de `.puml` en https://www.plantuml.com/plantuml/uml/

### Opción B — Renderizar en local con CLI (recomendado para la memoria)

```bash
# Mermaid → SVG/PNG
npx -p @mermaid-js/mermaid-cli mmdc -i er-diagram.mmd -o er-diagram.svg

# PlantUML → PNG/SVG (requiere Java + Graphviz)
# Linux: sudo apt install plantuml graphviz
plantuml -tsvg *.puml
plantuml -tpng *.puml
```

### Opción C — VS Code
Instala las extensiones **PlantUML** (jebbs) y **Mermaid Markdown Syntax Highlighting**.
Con el `.puml` abierto pulsa `Alt+D` para previsualizar.

### Opción D — Render automático en GitHub
GitHub renderiza nativamente bloques de Mermaid en Markdown. Por eso el ER se ofrece también
en `.mmd`: GitHub lo dibuja directamente cuando se referencia desde un README.

## Convenciones aplicadas

- **Idioma**: nombres de entidad en `snake_case` (convención PostgreSQL); nombres de clase
  en `PascalCase` (convención TypeScript / Java).
- **Cardinalidades**: notación crow's foot (`||--o{`, `}o--||`, etc.) en Mermaid; equivalente
  en PlantUML (`||..o{`).
- **Color**: paleta del proyecto — azul atlántico (`#1e6fa3`) para PKs, verde galego
  (`#5c8a3a`) para FKs, arena (`#fbf8f3`) de fondo.
- **Justificaciones** (`// JUSTIFICACIÓN: ...`) en notas dentro de cada diagrama para que
  el tribunal vea las decisiones de diseño explicadas en el propio diagrama.

## Trazabilidad con la rúbrica

Cada diagrama cubre uno o más contenidos DAM exigidos. Esta tabla se reutiliza en
`docs/memoria/trazabilidad-rubrica.md` (Fase 8):

| Contenido DAM rúbrica | Diagrama(s) | Dónde se ve |
|----------------------|-------------|-------------|
| BBDD relacional + ORM | ER + clases | Relaciones, PKs/FKs, jerarquía User → Customer/Designer |
| POO (herencia, polimorfismo, interfaces) | Clases | `BaseRepository<T>` + `IRepository`, `IService`, `BaseEntity` |
| XML/JSON import/export | Caso uso admin | UC18, UC19, UC20 |
| API REST | Secuencia compra | Llamadas GET/POST/PATCH a `/api/*` |
| Sockets / hilos / comunicación procesos | Secuencia push + despliegue | `worker_threads` + Socket.IO + FCM |
| Notificaciones tiempo real | Secuencia push | Socket.IO + FCM combinados |
| Seguridad y roles | Secuencia push | `AuthMiddleware` + `requireRole(DISEÑADOR)` |
| Multiplataforma | Despliegue | Android + Desktop + Web + Backend |
| Compatibilidad Linux | Despliegue | Todo el stack en Alpine + scripts `.sh` |
| Backup | Despliegue | `backup.sh` con cron y volumen de retención |
| Comunicación entre procesos | Despliegue + secuencia push | `worker_threads` ↔ `Socket.IO` ↔ FCM externo |
