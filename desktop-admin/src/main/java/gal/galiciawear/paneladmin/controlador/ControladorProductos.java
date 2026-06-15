package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.Producto;
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
import javafx.scene.control.TextField;

/** Gestión de productos: listar (incl. inactivos), activar/desactivar y retirar. */
public class ControladorProductos implements ControladorVista {

    private static final String TODOS = "Todos";
    private static final String ACTIVOS = "Activos";
    private static final String INACTIVOS = "Inactivos";

    private final Contexto contexto;

    @FXML private TextField campoBusqueda;
    @FXML private ComboBox<String> filtroEstado;
    @FXML private TableView<Producto> tabla;
    @FXML private TableColumn<Producto, String> colNombre;
    @FXML private TableColumn<Producto, String> colMarca;
    @FXML private TableColumn<Producto, String> colPrecio;
    @FXML private TableColumn<Producto, String> colMaterial;
    @FXML private TableColumn<Producto, String> colActivo;
    @FXML private Button botonAlternar;
    @FXML private Button botonRetirar;

    public ControladorProductos(Contexto contexto) {
        this.contexto = contexto;
    }

    /**
     * Inicialización FXML: enlaza cada columna con su propiedad del modelo Producto,
     * configura el combo de filtro y el campo de búsqueda, y carga la tabla.
     */
    @FXML
    private void initialize() {
        colNombre.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().nombre()));
        colMarca.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().nombreMarca()));
        colPrecio.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().precioBase()));
        colMaterial.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().materialPrincipal()));
        colActivo.setCellValueFactory(p -> new SimpleStringProperty(p.getValue().activo() ? "Sí" : "No"));

        filtroEstado.getItems().setAll(TODOS, ACTIVOS, INACTIVOS);
        filtroEstado.setValue(TODOS);
        filtroEstado.setOnAction(e -> refrescar());
        campoBusqueda.setOnAction(e -> refrescar());

        refrescar();
    }

    /** Recarga la tabla aplicando el filtro de estado y el texto de búsqueda, en segundo plano. */
    @FXML
    private void refrescar() {
        Boolean activo = switch (filtroEstado.getValue()) {
            case ACTIVOS -> Boolean.TRUE;
            case INACTIVOS -> Boolean.FALSE;
            default -> null;
        };
        String busqueda = campoBusqueda.getText();
        EjecutorTareas.ejecutar(
                () -> contexto.productos.listar(activo, busqueda),
                lista -> tabla.setItems(FXCollections.observableArrayList(lista)),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    /** Invierte el estado activo/inactivo del producto seleccionado y recarga al terminar. */
    @FXML
    private void alternarActivo() {
        Producto seleccionado = tabla.getSelectionModel().getSelectedItem();
        if (seleccionado == null) {
            Alertas.info("Sin selección", "Selecciona un producto en la tabla.");
            return;
        }
        boolean nuevoEstado = !seleccionado.activo();
        EjecutorTareas.ejecutar(
                () -> { contexto.productos.cambiarActivo(seleccionado.id(), nuevoEstado); return null; },
                ok -> refrescar(),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    /** Retira del catálogo el producto seleccionado, previa confirmación del administrador. */
    @FXML
    private void retirar() {
        Producto seleccionado = tabla.getSelectionModel().getSelectedItem();
        if (seleccionado == null) {
            Alertas.info("Sin selección", "Selecciona un producto en la tabla.");
            return;
        }
        if (!Alertas.confirmar("Retirar producto",
                "¿Retirar \"" + seleccionado.nombre() + "\" del catálogo?")) {
            return;
        }
        EjecutorTareas.ejecutar(
                () -> { contexto.productos.retirar(seleccionado.id()); return null; },
                ok -> refrescar(),
                error -> Alertas.error("Error", mensajeDe(error)));
    }

    /** Mensaje legible del error: el del backend si es ErrorApi, o uno genérico de red. */
    private String mensajeDe(Throwable error) {
        return error instanceof ErrorApi ? error.getMessage() : "No se pudo conectar con el servidor";
    }
}
