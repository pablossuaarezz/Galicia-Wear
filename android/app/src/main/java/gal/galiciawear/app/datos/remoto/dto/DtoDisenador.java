package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Perfil público de diseñador devuelto por el backend (sin el IBAN, que nunca
 * se expone). Lo usan GET/POST /disenadores/solicitar, GET/PATCH /disenadores/yo.
 */
public class DtoDisenador {
    @SerializedName("usuarioId")
    public String usuarioId;

    @SerializedName("nombreMarca")
    public String nombreMarca;

    @SerializedName("biografia")
    public String biografia;

    @SerializedName("ciudad")
    public String ciudad;

    @SerializedName("validado")
    public boolean validado;

    @SerializedName("fechaValidacion")
    public String fechaValidacion;

    @SerializedName("urlLogo")
    public String urlLogo;

    @SerializedName("urlWeb")
    public String urlWeb;

    @SerializedName("fechaCreacion")
    public String fechaCreacion;
}
