package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de la petición POST /auth/registro. */
public class DtoPeticionRegistro {
    /** Correo electrónico del nuevo usuario. */
    @SerializedName("correo")
    public final String correo;

    /** Contraseña en texto plano elegida por el nuevo usuario (se envía por HTTPS). */
    @SerializedName("contrasena")
    public final String contrasena;

    /** Nombre del nuevo usuario. */
    @SerializedName("nombre")
    public final String nombre;

    /** Apellidos del nuevo usuario. */
    @SerializedName("apellidos")
    public final String apellidos;

    /** Rol con el que se registra el usuario (p. ej. "CLIENTE" o "DISENADOR"). */
    @SerializedName("rol")
    public final String rol;

    /**
     * Crea la petición de registro de un nuevo usuario.
     *
     * @param correo     correo electrónico del nuevo usuario.
     * @param contrasena contraseña elegida.
     * @param nombre     nombre del usuario.
     * @param apellidos  apellidos del usuario.
     * @param rol        rol con el que se registra el usuario.
     */
    public DtoPeticionRegistro(String correo, String contrasena,
                                String nombre, String apellidos, String rol) {
        this.correo     = correo;
        this.contrasena = contrasena;
        this.nombre     = nombre;
        this.apellidos  = apellidos;
        this.rol        = rol;
    }
}
