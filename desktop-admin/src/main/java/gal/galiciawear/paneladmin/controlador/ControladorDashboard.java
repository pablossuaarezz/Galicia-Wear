package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.Estadisticas;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import javafx.collections.FXCollections;
import javafx.concurrent.ScheduledService;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.chart.PieChart;
import javafx.scene.control.Label;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;
import javafx.util.Duration;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Dashboard con KPIs y gráfico de pedidos por estado. Se auto-refresca cada 15 s mediante un
 * {@link ScheduledService} (hilo aparte), de modo que la ventana refleja "en vivo" la actividad
 * sin bloquear la interfaz ni requerir un servidor WebSocket.
 */
public class ControladorDashboard implements ControladorVista {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final Contexto contexto;

    @FXML private FlowPane panelTarjetas;
    @FXML private PieChart graficoEstados;
    @FXML private Label etiquetaActualizado;

    private ScheduledService<Estadisticas> servicio;

    public ControladorDashboard(Contexto contexto) {
        this.contexto = contexto;
    }

    @FXML
    private void initialize() {
        servicio = new ScheduledService<>() {
            @Override
            protected Task<Estadisticas> createTask() {
                return new Task<>() {
                    @Override
                    protected Estadisticas call() {
                        return contexto.estadisticas.obtener();
                    }
                };
            }
        };
        servicio.setPeriod(Duration.seconds(15));
        servicio.setOnSucceeded(evento -> pintar(servicio.getValue()));
        servicio.setOnFailed(evento -> etiquetaActualizado.setText("No se pudieron cargar las estadísticas"));
        servicio.start();
    }

    @FXML
    private void refrescar() {
        servicio.restart();
    }

    @Override
    public void alSalir() {
        if (servicio != null) {
            servicio.cancel();
        }
    }

    private void pintar(Estadisticas e) {
        panelTarjetas.getChildren().setAll(
                tarjeta("Usuarios", String.valueOf(e.totalUsuarios()), false),
                tarjeta("Clientes", String.valueOf(e.totalClientes()), false),
                tarjeta("Diseñadores", String.valueOf(e.totalDisenadores()), false),
                tarjeta("Pendientes de validar", String.valueOf(e.totalDisenadoresPendientes()),
                        e.totalDisenadoresPendientes() > 0),
                tarjeta("Productos", String.valueOf(e.totalProductos()), false),
                tarjeta("Pedidos del mes", String.valueOf(e.totalPedidosMes()), false),
                tarjeta("Ingresos del mes", e.ingresosMes() + " €", false));

        var datos = FXCollections.<PieChart.Data>observableArrayList();
        e.pedidosPorEstado().forEach((estado, cantidad) ->
                datos.add(new PieChart.Data(estado + " (" + cantidad + ")", cantidad)));
        graficoEstados.setData(datos);

        etiquetaActualizado.setText("Actualizado a las " + LocalTime.now().format(HORA));
    }

    private Node tarjeta(String etiqueta, String valor, boolean alerta) {
        Label valorLabel = new Label(valor);
        valorLabel.getStyleClass().add("tarjeta-valor");
        Label etiquetaLabel = new Label(etiqueta);
        etiquetaLabel.getStyleClass().add("tarjeta-etiqueta");
        VBox tarjeta = new VBox(4, valorLabel, etiquetaLabel);
        tarjeta.getStyleClass().add("tarjeta");
        if (alerta) {
            tarjeta.getStyleClass().add("tarjeta-alerta");
        }
        return tarjeta;
    }
}
