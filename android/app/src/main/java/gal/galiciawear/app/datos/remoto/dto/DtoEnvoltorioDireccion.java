package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura {@code { "direccion": {...} }} de POST /direcciones. */
public class DtoEnvoltorioDireccion {
    @SerializedName("direccion")
    public DtoRespuestaDireccion direccion;
}
