package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Respuesta del backend en /auth/login y /auth/refresh. */
public class DtoRespuestaToken {
    @SerializedName("tokenAcceso")
    public String tokenAcceso;

    // El backend lo envía como "tokenRefresco" (no "tokenRefresh"): con el nombre
    // equivocado el refresh token llegaba null y la sesión nunca se podía renovar.
    @SerializedName("tokenRefresco")
    public String tokenRefresh;

    @SerializedName("usuario")
    public DtoRespuestaUsuario usuario;
}
