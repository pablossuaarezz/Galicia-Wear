# GaliciaWear — Panel Admin (JavaFX)

> Stub de Fase 0. El proyecto Maven JavaFX completo se genera en **Fase 5**.

## Stack previsto

- **Java 17 LTS** + **JavaFX 21**.
- **Maven** (no Gradle, para diferenciar con Android y demostrar dominio de ambos).
- **FXML** + **Scene Builder** para vistas.
- **Arquitectura MVC**: controladores por vista, capa de servicio HTTP hacia la API REST.
- **HTTP client**: `java.net.http` (JDK 11+) o OkHttp.
- **WebSocket cliente**: dashboard se actualiza en vivo cuando llega un pedido.
- **Hilos**: todas las llamadas en `Task<>` de JavaFX (nunca en hilo UI).
- **Empaquetado**: `jpackage` → `.deb` y `.AppImage` para Linux.
- **Tests**: TestFX (≥40% cobertura).

## Vistas previstas

1. **Login** (JWT).
2. **Dashboard** con KPIs (ventas, pedidos pendientes, top diseñadores) — JavaFX Charts.
3. **Gestión de diseñadores** (validar solicitudes, suspender, historial).
4. **Gestión de productos** (moderación, certificados, retirar).
5. **Gestión de pedidos** (cambiar estado, reembolsos).
6. **Importador masivo** CSV/XML/JSON → `POST /import/products`.
7. **Exportador** a XML y JSON (cumple requisito XML/JSON de la rúbrica).
8. **Visor de logs de auditoría** (lee Mongo a través de la API).

## Justificación arquitectónica

JavaFX cumple el requisito de la rúbrica DAM "Interfaces gráficas (mínimo Swing)" superándolo
ampliamente: JavaFX es el sucesor moderno de Swing, con FXML declarativo, CSS, animaciones y
binding de propiedades. Esto da munición para defensa oral (¿por qué JavaFX y no Swing?).
