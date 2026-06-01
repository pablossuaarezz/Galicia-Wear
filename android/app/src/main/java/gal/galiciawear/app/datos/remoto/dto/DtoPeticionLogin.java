package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de la petición POST /auth/login. */
public class DtoPeticionLogin {
    @SerializedName("correo")
    public final String correo;

    @SerializedName("contrasena")
    public final String contrasena;

    public DtoPeticionLogin(String correo, String contrasena) {
        this.correo    = correo;
        this.contrasena = contrasena;
    }
}
