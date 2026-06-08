package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura {@code { "noLeidas": N }} de GET /notificaciones/contador (para el badge). */
public class DtoContadorNotificaciones {
    @SerializedName("noLeidas")
    public int noLeidas;
}
