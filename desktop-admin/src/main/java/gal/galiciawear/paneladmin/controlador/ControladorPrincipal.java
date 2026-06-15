package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.nucleo.Navegacion;
import gal.galiciawear.paneladmin.util.Alertas;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;

/** Shell principal: barra lateral de navegación + área central que aloja cada vista. */
public class ControladorPrincipal {

    private final Contexto contexto;

    @FXML private BorderPane contenedorCentral;
    @FXML private Label etiquetaUsuario;

    private ControladorVista vistaActual;

    public ControladorPrincipal(Contexto contexto) {
        this.contexto = contexto;
    }

    /** JavaFX invoca este método tras inyectar los nodos FXML: muestra el usuario y abre el dashboard. */
    @FXML
    private void initialize() {
        String correo = contexto.sesion.getCorreo();
        etiquetaUsuario.setText(correo == null ? "Administrador" : correo);
        irDashboard();
    }

    @FXML private void irDashboard() { mostrar("dashboard.fxml"); }
    @FXML private void irDisenadores() { mostrar("disenadores.fxml"); }
    @FXML private void irProductos() { mostrar("productos.fxml"); }
    @FXML private void irPedidos() { mostrar("pedidos.fxml"); }
    @FXML private void irImportExport() { mostrar("importexport.fxml"); }
    @FXML private void irLogs() { mostrar("logs.fxml"); }

    // Cada método irXxx carga el FXML de la sección correspondiente en el área central.

    /** Pide confirmación y, si se acepta, cierra sesión en el servidor y vuelve al login. */
    @FXML
    private void cerrarSesion() {
        if (!Alertas.confirmar("Cerrar sesión", "¿Seguro que quieres cerrar la sesión?")) {
            return;
        }
        if (vistaActual != null) {
            vistaActual.alSalir();
        }
        EjecutorTareas.ejecutar(
                () -> { contexto.autenticacion.cerrarSesion(); return null; },
                ok -> contexto.navegacion.mostrarLogin(),
                error -> contexto.navegacion.mostrarLogin());
    }

    /**
     * Sustituye la vista central por el FXML indicado. Antes notifica a la vista saliente
     * (alSalir) para que libere recursos, y registra la nueva si implementa ControladorVista.
     */
    private void mostrar(String fxml) {
        if (vistaActual != null) {
            vistaActual.alSalir();
            vistaActual = null;
        }
        Navegacion.Cargado<Object> cargado = contexto.navegacion.cargarConControlador(fxml);
        contenedorCentral.setCenter(cargado.raiz());
        if (cargado.controlador() instanceof ControladorVista cv) {
            vistaActual = cv;
        }
    }
}
