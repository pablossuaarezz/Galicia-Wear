package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de POST /disenadores/solicitar y PATCH /disenadores/yo.
 *
 * En edición (PATCH) el IBAN puede ir vacío para indicar "sin cambio": el backend
 * trata las cadenas vacías de los campos opcionales como ausentes (ver dto.ts).
 */
public class DtoPeticionDisenador {
    @SerializedName("nombreMarca")
    public final String nombreMarca;

    @SerializedName("biografia")
    public final String biografia;

    @SerializedName("ciudad")
    public final String ciudad;

    @SerializedName("iban")
    public final String iban;

    @SerializedName("urlLogo")
    public final String urlLogo;

    @SerializedName("urlWeb")
    public final String urlWeb;

    public DtoPeticionDisenador(String nombreMarca, String biografia, String ciudad,
                                String iban, String urlLogo, String urlWeb) {
        this.nombreMarca = nombreMarca;
        this.biografia   = biografia;
        this.ciudad      = ciudad;
        this.iban        = iban;
        this.urlLogo     = urlLogo;
        this.urlWeb      = urlWeb;
    }
}
