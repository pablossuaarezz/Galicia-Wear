package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de la petición POST /auth/login. */
public class DtoPeticionLogin {
    /** Correo electrónico del usuario que inicia sesión. */
    @SerializedName("correo")
    public final String correo;

    /** Contraseña en texto plano introducida por el usuario (se envía por HTTPS). */
    @SerializedName("contrasena")
    public final String contrasena;

    /**
     * Crea la petición de inicio de sesión.
     *
     * @param correo     correo electrónico del usuario.
     * @param contrasena contraseña del usuario.
     */
    public DtoPeticionLogin(String correo, String contrasena) {
        this.correo    = correo;
        this.contrasena = contrasena;
    }
}
