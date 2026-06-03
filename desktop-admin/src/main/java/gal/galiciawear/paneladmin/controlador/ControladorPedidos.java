package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.Pedido;
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

/** Gestión de pedidos: listado global (filtro por estado) y cancelación. */
public class ControladorPedidos implements ControladorVista {

    private static final String TODOS = "Todos";

    private final Contexto contexto;

    @FXML private ComboBox<String> filtroEstado;
    @FXML private TableView<Pedido> tabla;
    @FXML private TableColumn<Pedido, String> colNumero;
    @FXML private TableColumn<Pedido, String> colEstado;
    @FXML private TableColumn<Pedido, String> colTotal;
    @FXML private TableColumn<Pedido, String> colMetodo;
    @FXML private TableColumn<Pedido, String> colFecha;
    @FXML private Button botonCancelar;

    public ControladorPedidos(Contexto contexto) {
        this.contexto = contexto;
    }

    @FXML
    private void initialize() {
        colNumero.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().numeroPedido()));
        colEstado.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().estado()));
        colTotal.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().total()));
        colMetodo.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().metodoPago()));
        colFecha.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().fechaCreacion()));

        filtroEstado.getItems().setAll(TODOS,
                "PENDIENTE_PAGO", "PAGADO", "ACEPTADO", "ENVIADO", "ENTREGADO", "CANCELADO", "DEVUELTO");
        filtroEstado.setValue(TODOS);
        filtroEstado.setOnAction(e -> refrescar());

        refrescar();
    }

    @FXML
    private void refrescar() {
        String estado = TODOS.equals(filtroEstado.getValue()) ? null : filtroEstado.getValue();
        EjecutorTareas.ejecutar(
                () -> contexto.pedidos.listar(estado),
                lista -> tabla.setItems(FXCollections.observableArrayList(lista)),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    @FXML
    private void cancelar() {
        Pedido seleccionado = tabla.getSelectionModel().getSelectedItem();
        if (seleccionado == null) {
            Alertas.info("Sin selección", "Selecciona un pedido en la tabla.");
            return;
        }
        if (!Alertas.confirmar("Cancelar pedido",
                "¿Cancelar el pedido " + seleccionado.numeroPedido() + "? Se restaurará el stock.")) {
            return;
        }
        EjecutorTareas.ejecutar(
                () -> { contexto.pedidos.cancelar(seleccionado.id()); return null; },
                ok -> refrescar(),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    private String mensajeDe(Throwable error) {
        return error instanceof ErrorApi ? error.getMessage() : "No se pudo conectar con el servidor";
    }
}
