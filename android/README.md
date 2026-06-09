# GaliciaWear — App Android (cliente)

> Stub de Fase 0. El proyecto Android Studio completo se genera en **Fase 4**.

## Razón del stub

Crear el proyecto Android desde plantillas requiere usar Android Studio (o el CLI `gradle init`).
Adelantar archivos sueltos `.idea/`, `gradle-wrapper.jar`, etc. en Fase 0 contaminaría el repo
con artefactos parciales. En cambio, en Fase 4 se genera el proyecto limpio desde el IDE y se
ajusta a la arquitectura prevista:

- **Lenguaje**: Java 17 (DAM nativo, no Kotlin).
- **minSdk 24**, **targetSdk 34**.
- **Arquitectura**: MVVM estricto.
  - `ui/` Activities + Fragments + Adapters.
  - `viewmodel/` ViewModels con LiveData/Flow.
  - `repository/` capa de repositorios.
  - `data/local/` Room (caché offline).
  - `data/remote/` Retrofit + OkHttp interceptor JWT.
  - `model/` entidades de dominio.
- **DI**: Hilt.
- **UI**: Material Design 3, paleta azul atlántico + verde galego.
- **Tiempo real**: Socket.IO client + FCM.
- **Tests**: JUnit 5 + Mockito + Espresso (≥40% cobertura).

## Pantallas previstas (10)

1. Splash + Onboarding (3 slides).
2. Login / Registro (validación reactiva).
3. Home (productos destacados + filtro rápido sostenibilidad).
4. Buscador con filtros avanzados (precio, certificados, ciudad gallega).
5. Detalle de producto (info diseñador + "Ver en mi habitación" AR).
6. Carrito + Checkout (envío eco/estándar).
7. Mis pedidos + tracking.
8. Chat con diseñador (Socket.IO).
9. Perfil + preferencias de sostenibilidad.
10. Notificaciones (FCM).

## Criterios psicológicos UX aplicados

Se documentan en código (`// UX: ...`) y en `docs/memoria/ux.md`:
- Carga cognitiva ≤ 7 elementos por pantalla principal.
- Feedback inmediato (Snackbars, estados loading/empty/error).
- Ley de Fitts (acciones principales abajo, alcance pulgar).
- Ley de Hick (filtros agrupados).
- Accesibilidad AA (contraste, `contentDescription`, fuente escalable).
- Prevención de errores (confirmaciones en acciones destructivas).
