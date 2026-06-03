# GaliciaWear — Panel Admin (JavaFX)

Aplicación de escritorio de administración de GaliciaWear (Fase 5 del TFG). Cliente **JavaFX 21 +
Maven** con arquitectura **MVC** que consume la **API REST** del backend. No accede a ninguna base
de datos directamente: todo pasa por HTTP, y es el backend quien habla con **MySQL** y **MongoDB**
remotas.

## Stack

- **Java 17** (compilado con el JDK 24 local) + **JavaFX 21** (FXML + CSS).
- **Maven** (frente a Gradle de Android: demuestra dominio de ambos).
- **OkHttp** (HTTP) + **Jackson** (JSON).
- **Hilos**: toda llamada de red va en un `Task`/`ScheduledService` de JavaFX, nunca en el hilo UI.
- **Sesión**: tokens JWT persistidos con `java.util.prefs.Preferences` (sin BBDD local).
- **Tests**: JUnit 5 + MockWebServer (capa de servicios) y TestFX (UI de login).
- **Empaquetado**: `jpackage` → `.dmg` (macOS) / `.deb` / `app-image` (Linux).

## Arquitectura (MVC)

```
gal.galiciawear.paneladmin
├── Lanzador / AplicacionPanel       arranque JavaFX
├── configuracion/                   URL de la API + GestorSesion (Preferences)
├── modelo/                          records que mapean los DTO de la API
├── servicio/                        capa "modelo" de MVC: ClienteHttp + 7 servicios REST
├── controlador/                     un controlador por vista FXML
├── nucleo/                          Contexto (DI manual) + Navegacion (router FXML)
└── util/                            EjecutorTareas (hilos) + Alertas (diálogos)
recursos: vista/*.fxml  ·  estilo/tema.css
```

## Vistas

1. **Login** — solo se permite el acceso a cuentas con rol `ADMIN`.
2. **Dashboard** — KPIs + `PieChart` de pedidos por estado, auto-refresco cada 15 s.
3. **Diseñadores** — listado (incl. pendientes) + aprobar/rechazar.
4. **Productos** — listado (incl. inactivos) + activar/desactivar + retirar.
5. **Pedidos** — listado global con filtro por estado + cancelar.
6. **Importar / Exportar** — catálogo a/desde JSON y XML.
7. **Logs de auditoría** — lectura de `activity_logs` (MongoDB) vía la API.

## Arrancar en desarrollo

Requiere el **backend en marcha** (apuntando a MySQL/Mongo remotas) y un usuario con rol `ADMIN`
(el `seed` del backend crea uno).

```bash
cd desktop-admin
mvn javafx:run
```

La URL de la API se configura con la variable de entorno `GALICIAWEAR_API_URL`
(por defecto `http://localhost:3000`):

```bash
GALICIAWEAR_API_URL=https://api.galiciawear.example mvn javafx:run
```

## Tests

```bash
mvn test          # JUnit 5 (servicios, sesión) + TestFX (login)
```

Los tests de TestFX se omiten automáticamente en entornos sin pantalla (CI headless).

## Empaquetado (entregable)

```bash
mvn -DskipTests package    # genera target/panel-admin-0.5.0.jar (fat-JAR ejecutable)
java -jar target/panel-admin-0.5.0.jar

./empaquetar.sh            # genera el instalador nativo en dist/ (.dmg/.deb/app-image)
```

## Justificación arquitectónica (defensa oral)

JavaFX cumple el requisito DAM "Interfaces gráficas (mínimo Swing)" superándolo: es el sucesor
moderno de Swing, con FXML declarativo, CSS y binding de propiedades. La separación MVC (FXML =
vista, `controlador/` = controlador, `servicio/` = modelo) mantiene la lógica de red fuera de la UI,
y el uso de `Task`/`ScheduledService` cubre el contenido DAM de hilos sin congelar la ventana.
