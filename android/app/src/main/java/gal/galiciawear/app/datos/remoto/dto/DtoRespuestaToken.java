package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Respuesta del backend en /auth/login y /auth/refresh. */
public class DtoRespuestaToken {
    @SerializedName("tokenAcceso")
    public String tokenAcceso;

    @SerializedName("tokenRefresh")
    public String tokenRefresh;

    @SerializedName("usuario")
    public DtoRespuestaUsuario usuario;
}
