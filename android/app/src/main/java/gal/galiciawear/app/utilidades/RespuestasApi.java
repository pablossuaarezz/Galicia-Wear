package gal.galiciawear.app.utilidades;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import retrofit2.Response;

/**
 * Utilidades para interpretar las respuestas de error del backend GaliciaWear.
 *
 * El backend devuelve JSON con forma:
 *   { "error": "...", "codigo": "...", "detalles": [{ "campo": "...", "mensaje": "..." }] }
 * Centralizamos aquí la extracción del mensaje útil para no duplicarla en cada
 * repositorio (el mismo criterio que usa RepositorioAutenticacion).
 */
public final class RespuestasApi {

    /** Constructor privado: clase de solo métodos estáticos, no instanciable. */
    private RespuestasApi() { /* No instanciable */ }

    /**
     * Devuelve el primer detalle de validación o, en su defecto, el campo `error`.
     *
     * Orden de prioridad para construir el mensaje:
     * 1. Primer elemento de "detalles[].mensaje" (errores de validación de campos).
     * 2. Campo "error" general de la respuesta.
     * 3. Mensaje genérico "Error <código HTTP>" si no se puede leer/parsear el cuerpo.
     *
     * @param r respuesta de Retrofit que se considera fallida (errorBody no nulo).
     * @param <T> tipo del cuerpo esperado en caso de éxito (irrelevante aquí,
     *            ya que solo se lee el cuerpo de error).
     * @return mensaje de error legible para mostrar al usuario.
     */
    public static String extraerMensajeError(Response<?> r) {
        try {
            // Sin errorBody no hay JSON que parsear: usamos el código HTTP como mensaje.
            if (r.errorBody() == null) return "Error " + r.code();
            String cuerpo = r.errorBody().string();
            JsonObject obj = JsonParser.parseString(cuerpo).getAsJsonObject();
            // Prioridad 1: errores de validación de campos concretos (p. ej. "el email no es válido").
            if (obj.has("detalles") && obj.get("detalles").isJsonArray()) {
                JsonArray det = obj.getAsJsonArray("detalles");
                if (det.size() > 0 && det.get(0).getAsJsonObject().has("mensaje")) {
                    return det.get(0).getAsJsonObject().get("mensaje").getAsString();
                }
            }
            // Prioridad 2: mensaje de error general devuelto por el backend.
            if (obj.has("error")) return obj.get("error").getAsString();
            // Prioridad 3: el JSON no tiene la forma esperada; se informa solo del código HTTP.
            return "Error " + r.code();
        } catch (Exception e) {
            // Cuerpo no es JSON válido, stream ya consumido, etc.: fallback seguro.
            return "Error " + r.code();
        }
    }
}
