package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Perfil público de diseñador devuelto por el backend (sin el IBAN, que nunca
 * se expone). Lo usan GET/POST /disenadores/solicitar, GET/PATCH /disenadores/yo.
 */
public class DtoDisenador {
    /** Identificador del usuario propietario de este perfil de diseñador. */
    @SerializedName("usuarioId")
    public String usuarioId;

    /** Nombre comercial o de marca del diseñador. */
    @SerializedName("nombreMarca")
    public String nombreMarca;

    /** Texto descriptivo / biografía del diseñador o de su marca. */
    @SerializedName("biografia")
    public String biografia;

    /** Ciudad de residencia o de actividad del diseñador. */
    @SerializedName("ciudad")
    public String ciudad;

    /** Indica si el perfil de diseñador ha sido validado por el equipo de GaliciaWear. */
    @SerializedName("validado")
    public boolean validado;

    /** Fecha en la que se validó el perfil de diseñador (null si aún no está validado). */
    @SerializedName("fechaValidacion")
    public String fechaValidacion;

    /** URL del logotipo de la marca/diseñador. */
    @SerializedName("urlLogo")
    public String urlLogo;

    /** URL de la página web del diseñador (opcional). */
    @SerializedName("urlWeb")
    public String urlWeb;

    /** Fecha de creación del perfil de diseñador. */
    @SerializedName("fechaCreacion")
    public String fechaCreacion;
}
