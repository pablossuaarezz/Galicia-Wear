package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.Disenador;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.servicio.ErrorApi;
import gal.galiciawear.paneladmin.util.Alertas;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;

/** Gestión de diseñadores: listar (con filtro validado/pendiente) y aprobar/rechazar. */
public class ControladorDisenadores implements ControladorVista {

    private static final String TODOS = "Todos";
    private static final String VALIDADOS = "Validados";
    private static final String PENDIENTES = "Pendientes";

    private final Contexto contexto;

    @FXML private ComboBox<String> filtroEstado;
    @FXML private TableView<Disenador> tabla;
    @FXML private TableColumn<Disenador, String> colMarca;
    @FXML private TableColumn<Disenador, String> colCiudad;
    @FXML private TableColumn<Disenador, String> colValidado;
    @FXML private TableColumn<Disenador, String> colWeb;
    @FXML private Button botonAprobar;
    @FXML private Button botonRechazar;

    public ControladorDisenadores(Contexto contexto) {
        this.contexto = contexto;
    }

    @FXML
    private void initialize() {
        colMarca.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().nombreMarca()));
        colCiudad.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().ciudad()));
        colValidado.setCellValueFactory(d ->
                new SimpleStringProperty(d.getValue().validado() ? "Validado" : "Pendiente"));
        colWeb.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().urlWeb()));

        filtroEstado.getItems().setAll(TODOS, VALIDADOS, PENDIENTES);
        filtroEstado.setValue(PENDIENTES);
        filtroEstado.setOnAction(e -> refrescar());

        refrescar();
    }

    @FXML
    private void refrescar() {
        Boolean validado = switch (filtroEstado.getValue()) {
            case VALIDADOS -> Boolean.TRUE;
            case PENDIENTES -> Boolean.FALSE;
            default -> null;
        };
        EjecutorTareas.ejecutar(
                () -> contexto.disenadores.listar(validado),
                lista -> tabla.setItems(FXCollections.observableArrayList(lista)),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    @FXML
    private void aprobar() {
        validar(true);
    }

    @FXML
    private void rechazar() {
        validar(false);
    }

    private void validar(boolean aprobar) {
        Disenador seleccionado = tabla.getSelectionModel().getSelectedItem();
        if (seleccionado == null) {
            Alertas.info("Sin selección", "Selecciona un diseñador en la tabla.");
            return;
        }
        EjecutorTareas.ejecutar(
                () -> { contexto.disenadores.validar(seleccionado.usuarioId(), aprobar); return null; },
                ok -> refrescar(),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    private String mensajeDe(Throwable error) {
        return error instanceof ErrorApi ? error.getMessage() : "No se pudo conectar con el servidor";
    }
}
