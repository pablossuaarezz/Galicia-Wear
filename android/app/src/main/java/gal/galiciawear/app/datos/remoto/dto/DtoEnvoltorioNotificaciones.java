package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura {@code { "notificaciones": [...], "total": N }} de GET /notificaciones. */
public class DtoEnvoltorioNotificaciones {
    @SerializedName("notificaciones")
    public List<DtoNotificacion> notificaciones;

    @SerializedName("total")
    public int total;
}
