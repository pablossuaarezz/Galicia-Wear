package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura que devuelve el backend con el listado completo de conversaciones
 * de chat/soporte del usuario. El JSON real tiene la forma
 * {@code { "conversaciones": [...] }}.
 *
 * Endpoint asociado: GET /chat/conversaciones.
 */
public class DtoEnvoltorioConversaciones {
    /** Lista de conversaciones del usuario autenticado. */
    @SerializedName("conversaciones")
    public List<DtoConversacion> conversaciones;
}
