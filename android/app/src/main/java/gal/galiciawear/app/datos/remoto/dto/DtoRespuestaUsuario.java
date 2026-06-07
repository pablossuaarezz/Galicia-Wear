package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Perfil del usuario autenticado — recibido en /auth/yo y en el login. */
public class DtoRespuestaUsuario {
    @SerializedName("id")
    public String id;

    @SerializedName("correo")
    public String correo;

    @SerializedName("nombre")
    public String nombre;

    @SerializedName("apellidos")
    public String apellidos;

    @SerializedName("telefono")
    public String telefono;

    // Foto de perfil como data URI base64 (o URL). Puede ser null.
    @SerializedName("avatarUrl")
    public String avatarUrl;

    @SerializedName("rol")
    public String rol;

    @SerializedName("fechaCreacion")
    public String fechaCreacion;
}
