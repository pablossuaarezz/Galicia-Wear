package gal.galiciawear.paneladmin.controlador;

import gal.galiciawear.paneladmin.modelo.ResultadoImportacion;
import gal.galiciawear.paneladmin.nucleo.Contexto;
import gal.galiciawear.paneladmin.servicio.ErrorApi;
import gal.galiciawear.paneladmin.util.Alertas;
import gal.galiciawear.paneladmin.util.EjecutorTareas;
import javafx.fxml.FXML;
import javafx.scene.control.TextArea;
import javafx.stage.FileChooser;
import javafx.stage.Window;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/** Importación/exportación del catálogo de productos en JSON y XML. */
public class ControladorImportExport implements ControladorVista {

    private final Contexto contexto;

    @FXML private TextArea areaResultado;

    public ControladorImportExport(Contexto contexto) {
        this.contexto = contexto;
    }

    // Los cuatro manejadores FXML delegan en exportar/importar indicando el formato.
    @FXML private void exportarJson() { exportar("json"); }
    @FXML private void exportarXml() { exportar("xml"); }
    @FXML private void importarJson() { importar("json"); }
    @FXML private void importarXml() { importar("xml"); }

    /** Pide al backend el catálogo en el formato indicado y, al recibirlo, lo guarda en un fichero local. */
    private void exportar(String formato) {
        registrar("Descargando catálogo en " + formato.toUpperCase() + "...");
        EjecutorTareas.ejecutar(
                () -> contexto.importExport.exportar(formato),
                contenido -> guardarEnFichero(formato, contenido),
                error -> Alertas.error("Error al exportar", mensajeDe(error)));
    }

    /** Abre un diálogo de guardado y escribe el contenido exportado en el fichero elegido (UTF-8). */
    private void guardarEnFichero(String formato, String contenido) {
        FileChooser selector = new FileChooser();
        selector.setInitialFileName("galiciawear_productos." + formato);
        selector.getExtensionFilters().add(
                new FileChooser.ExtensionFilter(formato.toUpperCase(), "*." + formato));
        File destino = selector.showSaveDialog(ventana());
        if (destino == null) {
            registrar("Exportación cancelada.");
            return;
        }
        try {
            Files.writeString(destino.toPath(), contenido, StandardCharsets.UTF_8);
            registrar("Catálogo exportado a:\n" + destino.getAbsolutePath());
        } catch (Exception e) {
            Alertas.error("Error al guardar", e.getMessage());
        }
    }

    /** Abre un fichero local del formato indicado, lo lee y lo envía al backend para importación masiva. */
    private void importar(String formato) {
        FileChooser selector = new FileChooser();
        selector.getExtensionFilters().add(
                new FileChooser.ExtensionFilter(formato.toUpperCase(), "*." + formato));
        File origen = selector.showOpenDialog(ventana());
        if (origen == null) {
            return;
        }
        final String datos;
        try {
            datos = Files.readString(origen.toPath(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            Alertas.error("Error al leer", e.getMessage());
            return;
        }
        registrar("Importando " + origen.getName() + "...");
        EjecutorTareas.ejecutar(
                () -> contexto.importExport.importar(formato, datos),
                this::mostrarResultado,
                error -> Alertas.error("Error al importar", mensajeDe(error)));
    }

    /** Compone un resumen textual de la importación (creados, actualizados y errores por fila). */
    private void mostrarResultado(ResultadoImportacion resultado) {
        StringBuilder texto = new StringBuilder();
        texto.append("Importación completada.\n")
                .append("Creados: ").append(resultado.creados()).append('\n')
                .append("Actualizados: ").append(resultado.actualizados()).append('\n')
                .append("Errores: ").append(resultado.errores().size()).append('\n');
        for (ResultadoImportacion.ErrorImportacion error : resultado.errores()) {
            texto.append("  · #").append(error.indice());
            if (error.nombre() != null) {
                texto.append(" (").append(error.nombre()).append(')');
            }
            texto.append(": ").append(error.motivo()).append('\n');
        }
        registrar(texto.toString());
    }

    /** Escribe un mensaje en el área de resultado de la vista. */
    private void registrar(String mensaje) {
        areaResultado.setText(mensaje);
    }

    /** Ventana actual (necesaria como propietaria de los diálogos de fichero); null si la escena no está montada. */
    private Window ventana() {
        return areaResultado.getScene() == null ? null : areaResultado.getScene().getWindow();
    }

    /** Mensaje legible del error: el del backend si es ErrorApi, o uno genérico de red. */
    private String mensajeDe(Throwable error) {
        return error instanceof ErrorApi ? error.getMessage() : "No se pudo conectar con el servidor";
    }
}
