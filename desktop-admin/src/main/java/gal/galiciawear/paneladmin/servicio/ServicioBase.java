package gal.galiciawear.paneladmin.servicio;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

/** Lógica común a todos los servicios: comprobación de errores y extracción de listas. */
public abstract class ServicioBase {

    protected final ClienteHttp http;

    protected ServicioBase(ClienteHttp http) {
        this.http = http;
    }

    /** Lanza {@link ErrorApi} con un mensaje legible si la respuesta no fue 2xx. */
    protected void exigirExito(RespuestaHttp respuesta) {
        if (!respuesta.exito()) {
            throw new ErrorApi(respuesta.codigo(), mensajeError(respuesta));
        }
    }

    /** Intenta extraer el mensaje de error del cuerpo JSON ({error} o {mensaje}). */
    protected static String mensajeError(RespuestaHttp respuesta) {
        try {
            JsonNode nodo = Json.leerArbol(respuesta.cuerpo());
            if (nodo.hasNonNull("error")) {
                return nodo.get("error").asText();
            }
            if (nodo.hasNonNull("mensaje")) {
                return nodo.get("mensaje").asText();
            }
        } catch (RuntimeException ignorado) {
            // cuerpo no-JSON
        }
        return "Error " + respuesta.codigo();
    }

    /** Convierte el array que cuelga de {@code clave} en una lista del tipo dado. */
    protected <T> List<T> listaDesde(RespuestaHttp respuesta, String clave, Class<T> tipo) {
        exigirExito(respuesta);
        JsonNode arr = Json.leerArbol(respuesta.cuerpo()).path(clave);
        List<T> lista = new ArrayList<>();
        if (arr.isArray()) {
            for (JsonNode nodo : arr) {
                lista.add(Json.convertir(nodo, tipo));
            }
        }
        return lista;
    }
}
