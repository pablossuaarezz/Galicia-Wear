package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * DTO que representa el número de notificaciones pendientes de leer del
 * usuario autenticado. Se utiliza para mostrar el contador (badge) sobre
 * el icono de notificaciones en la interfaz.
 *
 * Endpoint asociado: GET /notificaciones/contador, que devuelve la
 * envoltura {@code { "noLeidas": N }}.
 */
public class DtoContadorNotificaciones {
    /** Número de notificaciones sin leer del usuario. */
    @SerializedName("noLeidas")
    public int noLeidas;
}
