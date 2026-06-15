package gal.galiciawear.paneladmin;

import gal.galiciawear.paneladmin.configuracion.Configuracion;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.nucleo.Navegacion;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.application.Application;
import javafx.stage.Stage;

/**
 * Aplicación JavaFX del panel de administración (Fase 5).
 *
 * <p>Arquitectura MVC: las vistas son FXML, los controladores viven en {@code controlador/} y la
 * capa de "modelo" es el conjunto de servicios HTTP ({@code servicio/}) que hablan con la API REST.
 */
public class AplicacionPanel extends Application {

    /** Construye el contexto de dependencias y la navegación, y abre la pantalla de login. */
    @Override
    public void start(Stage escenario) {
        Contexto contexto = new Contexto(Configuracion.urlBaseApi());
        Navegacion navegacion = new Navegacion(escenario, contexto);
        contexto.navegacion = navegacion;

        escenario.setMinWidth(460);
        escenario.setMinHeight(560);
        navegacion.mostrarLogin();
    }

    /** Al cerrar la aplicación, apaga el pool de hilos de tareas en segundo plano. */
    @Override
    public void stop() {
        EjecutorTareas.apagar();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
