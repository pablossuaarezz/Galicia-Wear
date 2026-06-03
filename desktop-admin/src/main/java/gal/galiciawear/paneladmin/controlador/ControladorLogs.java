package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.LogActividad;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.servicio.ErrorApi;
import gal.galiciawear.paneladmin.util.Alertas;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;

/** Visor de logs de auditoría (lee la colección activity_logs de MongoDB vía la API). */
public class ControladorLogs implements ControladorVista {

    private final Contexto contexto;

    @FXML private TextField campoAccion;
    @FXML private TextField campoRecurso;
    @FXML private TableView<LogActividad> tabla;
    @FXML private TableColumn<LogActividad, String> colFecha;
    @FXML private TableColumn<LogActividad, String> colAccion;
    @FXML private TableColumn<LogActividad, String> colRecurso;
    @FXML private TableColumn<LogActividad, String> colUsuario;
    @FXML private TableColumn<LogActividad, String> colIp;

    public ControladorLogs(Contexto contexto) {
        this.contexto = contexto;
    }

    @FXML
    private void initialize() {
        colFecha.setCellValueFactory(l -> new SimpleStringProperty(l.getValue().fechaCreacion()));
        colAccion.setCellValueFactory(l -> new SimpleStringProperty(l.getValue().accion()));
        colRecurso.setCellValueFactory(l -> new SimpleStringProperty(l.getValue().recurso()));
        colUsuario.setCellValueFactory(l -> new SimpleStringProperty(l.getValue().usuarioId()));
        colIp.setCellValueFactory(l -> new SimpleStringProperty(l.getValue().ipOrigen()));

        campoAccion.setOnAction(e -> refrescar());
        campoRecurso.setOnAction(e -> refrescar());

        refrescar();
    }

    @FXML
    private void refrescar() {
        String accion = campoAccion.getText();
        String recurso = campoRecurso.getText();
        EjecutorTareas.ejecutar(
                () -> contexto.logs.listar(accion, recurso),
                lista -> tabla.setItems(FXCollections.observableArrayList(lista)),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    private String mensajeDe(Throwable error) {
        return error instanceof ErrorApi ? error.getMessage() : "No se pudo conectar con el servidor";
    }
}
