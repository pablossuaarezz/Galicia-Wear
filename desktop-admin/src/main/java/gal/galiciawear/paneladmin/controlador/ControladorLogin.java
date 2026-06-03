package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.servicio.ErrorApi;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TextField;

/** Pantalla de acceso. Solo permite entrar a cuentas con rol ADMIN. */
public class ControladorLogin {

    private final Contexto contexto;

    @FXML private TextField campoCorreo;
    @FXML private PasswordField campoContrasena;
    @FXML private Button botonEntrar;
    @FXML private ProgressIndicator indicadorCarga;
    @FXML private Label etiquetaError;

    public ControladorLogin(Contexto contexto) {
        this.contexto = contexto;
    }

    @FXML
    private void alEntrar() {
        String correo = campoCorreo.getText() == null ? "" : campoCorreo.getText().trim();
        String contrasena = campoContrasena.getText() == null ? "" : campoContrasena.getText();
        if (correo.isEmpty() || contrasena.isEmpty()) {
            mostrarError("Introduce tu correo y contraseña");
            return;
        }
        cargando(true);
        EjecutorTareas.ejecutar(
                () -> contexto.autenticacion.iniciarSesion(correo, contrasena),
                usuario -> {
                    cargando(false);
                    contexto.navegacion.mostrarPrincipal();
                },
                error -> {
                    cargando(false);
                    mostrarError(mensajeDe(error));
                });
    }

    private void cargando(boolean activo) {
        indicadorCarga.setVisible(activo);
        indicadorCarga.setManaged(activo);
        botonEntrar.setDisable(activo);
        if (activo) {
            etiquetaError.setText("");
        }
    }

    private void mostrarError(String mensaje) {
        etiquetaError.setText(mensaje);
    }

    private String mensajeDe(Throwable error) {
        if (error instanceof ErrorApi) {
            return error.getMessage();
        }
        return "No se pudo conectar con el servidor. Revisa que el backend esté arrancado.";
    }
}
