package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de la petición POST /auth/registro. */
public class DtoPeticionRegistro {
    @SerializedName("correo")
    public final String correo;

    @SerializedName("contrasena")
    public final String contrasena;

    @SerializedName("nombre")
    public final String nombre;

    @SerializedName("apellidos")
    public final String apellidos;

    @SerializedName("rol")
    public final String rol;

    public DtoPeticionRegistro(String correo, String contrasena,
                                String nombre, String apellidos, String rol) {
        this.correo     = correo;
        this.contrasena = contrasena;
        this.nombre     = nombre;
        this.apellidos  = apellidos;
        this.rol        = rol;
    }
}
