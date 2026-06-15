package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de POST /disenadores/solicitar y PATCH /disenadores/yo.
 *
 * En edición (PATCH) el IBAN puede ir vacío para indicar "sin cambio": el backend
 * trata las cadenas vacías de los campos opcionales como ausentes (ver dto.ts).
 */
public class DtoPeticionDisenador {
    /** Nombre comercial o de marca con el que se solicita el perfil de diseñador. */
    @SerializedName("nombreMarca")
    public final String nombreMarca;

    /** Biografía o descripción del diseñador/marca. */
    @SerializedName("biografia")
    public final String biografia;

    /** Ciudad de residencia o de actividad del diseñador. */
    @SerializedName("ciudad")
    public final String ciudad;

    /**
     * IBAN del diseñador para recibir pagos. En una edición (PATCH) puede
     * enviarse vacío para indicar que no se desea modificar el IBAN ya
     * registrado.
     */
    @SerializedName("iban")
    public final String iban;

    /** URL del logotipo de la marca del diseñador. */
    @SerializedName("urlLogo")
    public final String urlLogo;

    /** URL de la página web del diseñador (opcional). */
    @SerializedName("urlWeb")
    public final String urlWeb;

    /**
     * Crea la petición de alta o edición de perfil de diseñador.
     *
     * @param nombreMarca nombre comercial de la marca.
     * @param biografia   descripción/biografía del diseñador.
     * @param ciudad      ciudad de actividad.
     * @param iban        IBAN para pagos (puede ir vacío en ediciones para no modificarlo).
     * @param urlLogo     URL del logotipo de la marca.
     * @param urlWeb      URL de la página web del diseñador.
     */
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
