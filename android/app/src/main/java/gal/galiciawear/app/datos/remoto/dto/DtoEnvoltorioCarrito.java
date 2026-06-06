package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura {@code { "carrito": {...} }} de GET/POST/DELETE /carrito. */
public class DtoEnvoltorioCarrito {
    @SerializedName("carrito")
    public DtoRespuestaCarrito carrito;
}
