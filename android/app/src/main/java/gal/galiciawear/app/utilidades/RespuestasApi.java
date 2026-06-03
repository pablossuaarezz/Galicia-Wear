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

    private RespuestasApi() { /* No instanciable */ }

    /** Devuelve el primer detalle de validación o, en su defecto, el campo `error`. */
    public static String extraerMensajeError(Response<?> r) {
        try {
            if (r.errorBody() == null) return "Error " + r.code();
            String cuerpo = r.errorBody().string();
            JsonObject obj = JsonParser.parseString(cuerpo).getAsJsonObject();
            if (obj.has("detalles") && obj.get("detalles").isJsonArray()) {
                JsonArray det = obj.getAsJsonArray("detalles");
                if (det.size() > 0 && det.get(0).getAsJsonObject().has("mensaje")) {
                    return det.get(0).getAsJsonObject().get("mensaje").getAsString();
                }
            }
            if (obj.has("error")) return obj.get("error").getAsString();
            return "Error " + r.code();
        } catch (Exception e) {
            return "Error " + r.code();
        }
    }
}
