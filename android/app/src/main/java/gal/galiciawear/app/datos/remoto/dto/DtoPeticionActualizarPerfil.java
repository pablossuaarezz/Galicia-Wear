package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de PATCH /usuarios/yo/cliente. Solo se envían los campos no nulos
 * (el backend hace actualización parcial), así que un null significa
 * "no cambiar este campo".
 */
public class DtoPeticionActualizarPerfil {
    @SerializedName("nombre")    public String nombre;
    @SerializedName("apellidos") public String apellidos;
    @SerializedName("telefono")  public String telefono;
    // Data URI base64 de la foto de perfil.
    @SerializedName("avatarUrl") public String avatarUrl;
}
