package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura que devuelve el backend con el listado paginado de notificaciones
 * del usuario. El JSON real tiene la forma
 * {@code { "notificaciones": [...], "total": N }}.
 *
 * Endpoint asociado: GET /notificaciones.
 */
public class DtoEnvoltorioNotificaciones {
    /** Lista de notificaciones del usuario (página actual). */
    @SerializedName("notificaciones")
    public List<DtoNotificacion> notificaciones;

    /** Número total de notificaciones disponibles (para paginación). */
    @SerializedName("total")
    public int total;
}
