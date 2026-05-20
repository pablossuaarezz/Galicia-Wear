# Uso de Inteligencia Artificial en GaliciaWear

> Documento exigido por la rúbrica DAM 2024-26, apartado 7 ("Uso ético y crítico de IA").
> Se irá actualizando al cierre de cada fase.

## Modelo asistente

- **Claude Code** (Anthropic) — modelo `claude-opus-4-7` — usado como pair-programmer.
- Rol: arquitecto técnico, generación de scaffolding, revisión cruzada, redacción de tests.

## Principios aplicados

1. **Cero datos reales**: todas las personas, direcciones, IBAN y emails del seed son ficticios.
2. **Validación humana en bucle**: cada fase termina con un check-point (`PROGRESS.md`) en el que se acepta o rechaza lo generado antes de avanzar.
3. **Trazabilidad**: las decisiones arquitectónicas importantes llevan comentarios `// JUSTIFICACIÓN: ...` en el propio código, no solo en la memoria.
4. **No "vibe coding"**: cada patrón aplicado (Repository, DTO, MVVM, MVC) se justifica.

## Tabla de uso por fase

| Fase | Tareas asistidas por IA | Validación humana |
|------|-------------------------|-------------------|
| 0    | Generación de scaffolding (configs, Dockerfiles, CI, README) | Lectura de cada archivo + `docker compose config` + tests verdes |
| 1    | Borradores UML (Mermaid + PlantUML) | Revisión manual de cardinalidades y casos de uso |
| 2    | Estructura modular backend, DTOs zod, controladores, tests Jest | Lectura de tests + ejecución de la suite |
| 3    | Scripts pg_dump/mongodump, prueba de restauración | Restauración real en BBDD limpia |
| 4    | Pantallas Android (Material 3), ViewModels, tests JUnit/Espresso | Pruebas manuales en emulador + revisión UX |
| 5    | Controladores JavaFX, FXML, gráficas | Pruebas manuales con jpackage en Linux |
| 6    | Componentes React, hooks, tests Vitest | Pruebas manuales en navegador |
| 7    | Audit de seguridad, headers, rate limits | Pentesting manual de endpoints sensibles |
| 8    | Capturas, redacción de manual de usuario, guion de defensa oral | Cronometraje real del guion (≤ 12 min) |

## Riesgos asumidos y mitigación

- **Alucinaciones**: contrarrestadas con suite de tests + lecturas manuales.
- **Sesgo de stack**: el stack lo fijé yo (Java nativo, JavaFX, Node, React); no aceptaría sustituciones "porque el modelo prefiere otro".
- **Privacidad**: ninguna conversación con la IA incluye datos personales reales.
