package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testfx.framework.junit5.ApplicationTest;
import org.testfx.util.WaitForAsyncUtils;

import java.awt.GraphicsEnvironment;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test de interfaz (TestFX) del flujo de login. El backend se simula con MockWebServer, por lo que
 * no requiere ni servidor real ni base de datos. Se omite automáticamente en entornos sin pantalla.
 */
class ControladorLoginTest extends ApplicationTest {

    private MockWebServer servidor;
    private Preferences nodo;

    @BeforeAll
    static void requiereEntornoGrafico() {
        Assumptions.assumeFalse(GraphicsEnvironment.isHeadless(),
                "Los tests TestFX necesitan un entorno gráfico");
    }

    @Override
    public void start(Stage escenario) throws Exception {
        servidor = new MockWebServer();
        servidor.start();
        nodo = Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
        Contexto contexto = new Contexto(servidor.url("/").toString(), new GestorSesion(nodo));

        FXMLLoader cargador = new FXMLLoader(
                getClass().getResource("/gal/galiciawear/paneladmin/vista/login.fxml"));
        cargador.setControllerFactory(tipo -> {
            try {
                return tipo.getConstructor(Contexto.class).newInstance(contexto);
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException(e);
            }
        });
        Parent raiz = cargador.load();
        escenario.setScene(new Scene(raiz));
        escenario.show();
        escenario.toFront();
    }

    @AfterEach
    void cerrar() throws Exception {
        if (servidor != null) {
            servidor.shutdown();
        }
        if (nodo != null) {
            nodo.removeNode();
        }
    }

    /** Pulsar "Entrar" con los campos vacíos debe mostrar un aviso sobre el correo. */
    @Test
    void camposVaciosMuestranAviso() {
        Button boton = lookup("#botonEntrar").queryButton();
        interact(boton::fire);

        Label error = lookup("#etiquetaError").queryAs(Label.class);
        assertTrue(error.getText().toLowerCase().contains("correo"),
                "Debe avisar de que faltan las credenciales");
    }

    /** Con un 401 simulado del backend, la etiqueta de error debe indicar credenciales incorrectas. */
    @Test
    void credencialesInvalidasMuestranError() throws TimeoutException {
        servidor.enqueue(new MockResponse().setResponseCode(401)
                .setBody("{\"error\":\"Credenciales inválidas\"}"));

        TextField correo = lookup("#campoCorreo").queryAs(TextField.class);
        PasswordField contrasena = lookup("#campoContrasena").queryAs(PasswordField.class);
        Button boton = lookup("#botonEntrar").queryButton();
        interact(() -> {
            correo.setText("admin@gw.gal");
            contrasena.setText("malparami");
            boton.fire();
        });

        Label error = lookup("#etiquetaError").queryAs(Label.class);
        WaitForAsyncUtils.waitFor(5, TimeUnit.SECONDS, () -> !error.getText().isBlank());

        assertTrue(error.getText().toLowerCase().contains("incorrect"),
                "Debe mostrar que las credenciales son incorrectas");
    }
}
