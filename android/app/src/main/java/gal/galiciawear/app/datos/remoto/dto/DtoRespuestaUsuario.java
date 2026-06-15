package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Perfil del usuario autenticado, recibido en GET /auth/yo y dentro de la
 * respuesta de login/registro ({@link DtoRespuestaToken}).
 */
public class DtoRespuestaUsuario {
    /** Identificador único del usuario. */
    @SerializedName("id")
    public String id;

    /** Correo electrónico del usuario (usado como credencial de login). */
    @SerializedName("correo")
    public String correo;

    /** Nombre del usuario. */
    @SerializedName("nombre")
    public String nombre;

    /** Apellidos del usuario. */
    @SerializedName("apellidos")
    public String apellidos;

    /** Teléfono de contacto del usuario, puede ser null. */
    @SerializedName("telefono")
    public String telefono;

    // Foto de perfil como data URI base64 (o URL). Puede ser null.
    /** URL o data URI (base64) de la foto de perfil del usuario; puede ser null si no tiene avatar. */
    @SerializedName("avatarUrl")
    public String avatarUrl;

    /** Rol del usuario en la plataforma (p. ej. "CLIENTE" o "DISENADOR"). */
    @SerializedName("rol")
    public String rol;

    /** Fecha de creación de la cuenta, en el formato proporcionado por el backend. */
    @SerializedName("fechaCreacion")
    public String fechaCreacion;
}
