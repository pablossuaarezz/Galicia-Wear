package gal.galiciawear.paneladmin.servicio;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** ObjectMapper compartido y utilidades JSON. Ignora propiedades desconocidas (la API evoluciona). */
public final class Json {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private Json() {
    }

    public static ObjectMapper mapper() {
        return MAPPER;
    }

    public static JsonNode leerArbol(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException("JSON no válido: " + e.getMessage(), e);
        }
    }

    public static <T> T convertir(JsonNode nodo, Class<T> tipo) {
        try {
            return MAPPER.treeToValue(nodo, tipo);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo convertir el JSON: " + e.getMessage(), e);
        }
    }

    public static String escribir(Object objeto) {
        try {
            return MAPPER.writeValueAsString(objeto);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo serializar a JSON: " + e.getMessage(), e);
        }
    }
}
