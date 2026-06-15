package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de PATCH /usuarios/yo/cliente. Solo se envían los campos no nulos
 * (el backend hace actualización parcial), así que un null significa
 * "no cambiar este campo".
 */
public class DtoPeticionActualizarPerfil {
    /** Nuevo nombre del usuario, o {@code null} si no se quiere modificar. */
    @SerializedName("nombre")    public String nombre;
    /** Nuevos apellidos del usuario, o {@code null} si no se quiere modificar. */
    @SerializedName("apellidos") public String apellidos;
    /** Nuevo teléfono de contacto del usuario, o {@code null} si no se quiere modificar. */
    @SerializedName("telefono")  public String telefono;
    // Data URI base64 de la foto de perfil.
    /** Nueva foto de perfil codificada como data URI en base64, o {@code null} si no cambia. */
    @SerializedName("avatarUrl") public String avatarUrl;
}
