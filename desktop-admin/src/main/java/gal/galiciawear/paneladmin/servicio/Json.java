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

    /** Devuelve el ObjectMapper compartido (configurado para tolerar campos desconocidos). */
    public static ObjectMapper mapper() {
        return MAPPER;
    }

    /** Parsea una cadena JSON a su árbol de nodos; lanza RuntimeException si el JSON no es válido. */
    public static JsonNode leerArbol(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException("JSON no válido: " + e.getMessage(), e);
        }
    }

    /** Convierte un nodo JSON al tipo indicado (deserialización a un record/POJO del modelo). */
    public static <T> T convertir(JsonNode nodo, Class<T> tipo) {
        try {
            return MAPPER.treeToValue(nodo, tipo);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo convertir el JSON: " + e.getMessage(), e);
        }
    }

    /** Serializa un objeto a su representación JSON en texto. */
    public static String escribir(Object objeto) {
        try {
            return MAPPER.writeValueAsString(objeto);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo serializar a JSON: " + e.getMessage(), e);
        }
    }
}
