package gal.galiciawear.paneladmin.nucleo;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.reflect.Constructor;

/**
 * Centraliza la carga de vistas FXML y el cambio de escena. La {@code controllerFactory} inyecta
 * el {@link Contexto} en cualquier controlador que declare un constructor {@code (Contexto)}.
 */
public class Navegacion {

    private static final String BASE_VISTAS = "/gal/galiciawear/paneladmin/vista/";
    private static final String HOJA_ESTILOS = "/gal/galiciawear/paneladmin/estilo/tema.css";

    private final Stage escenario;
    private final Contexto contexto;

    public Navegacion(Stage escenario, Contexto contexto) {
        this.escenario = escenario;
        this.contexto = contexto;
    }

    /** Carga un FXML inyectando el contexto en su controlador. Devuelve la raíz de la vista. */
    public Parent cargar(String nombreFxml) {
        FXMLLoader cargador = new FXMLLoader(
                Navegacion.class.getResource(BASE_VISTAS + nombreFxml));
        cargador.setControllerFactory(this::crearControlador);
        try {
            return cargador.load();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo cargar la vista " + nombreFxml, e);
        }
    }

    /** Devuelve el par (raíz, controlador) de una vista cargada. */
    public <C> Cargado<C> cargarConControlador(String nombreFxml) {
        FXMLLoader cargador = new FXMLLoader(
                Navegacion.class.getResource(BASE_VISTAS + nombreFxml));
        cargador.setControllerFactory(this::crearControlador);
        try {
            Parent raiz = cargador.load();
            return new Cargado<>(raiz, cargador.getController());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo cargar la vista " + nombreFxml, e);
        }
    }

    public void mostrarLogin() {
        cambiarEscena(cargar("login.fxml"), "GaliciaWear · Acceso administrador", 460, 560);
    }

    public void mostrarPrincipal() {
        cambiarEscena(cargar("principal.fxml"), "GaliciaWear · Panel de administración", 1100, 720);
    }

    private void cambiarEscena(Parent raiz, String titulo, double ancho, double alto) {
        Scene escena = new Scene(raiz, ancho, alto);
        aplicarEstilos(escena);
        escenario.setScene(escena);
        escenario.setTitle(titulo);
        escenario.centerOnScreen();
        if (!escenario.isShowing()) {
            escenario.show();
        }
    }

    private void aplicarEstilos(Scene escena) {
        var hoja = Navegacion.class.getResource(HOJA_ESTILOS);
        if (hoja != null) {
            escena.getStylesheets().add(hoja.toExternalForm());
        }
    }

    // ControllerFactory: inyecta el Contexto si el controlador lo admite.
    private Object crearControlador(Class<?> tipo) {
        try {
            Constructor<?> conContexto = tipo.getConstructor(Contexto.class);
            return conContexto.newInstance(contexto);
        } catch (NoSuchMethodException sinContexto) {
            try {
                return tipo.getDeclaredConstructor().newInstance();
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException("No se pudo instanciar el controlador " + tipo, e);
            }
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("No se pudo instanciar el controlador " + tipo, e);
        }
    }

    /** Par raíz + controlador. */
    public record Cargado<C>(Parent raiz, C controlador) {
    }
}
