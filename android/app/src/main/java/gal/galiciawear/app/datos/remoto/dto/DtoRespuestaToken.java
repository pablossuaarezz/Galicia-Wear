package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Respuesta del backend en POST /auth/login, POST /auth/registro y
 * POST /auth/refresh: contiene los tokens JWT de sesión y, en login/registro,
 * el perfil del usuario autenticado.
 */
public class DtoRespuestaToken {
    /** Token de acceso (JWT), de corta duración (15 minutos), usado en la cabecera Authorization. */
    @SerializedName("tokenAcceso")
    public String tokenAcceso;

    // El backend lo envía como "tokenRefresco" (no "tokenRefresh"): con el nombre
    // equivocado el refresh token llegaba null y la sesión nunca se podía renovar.
    /** Token de refresco (JWT), de mayor duración, usado para obtener un nuevo token de acceso. */
    @SerializedName("tokenRefresco")
    public String tokenRefresh;

    /** Perfil del usuario autenticado (puede ser null en la respuesta de /auth/refresh). */
    @SerializedName("usuario")
    public DtoRespuestaUsuario usuario;
}
