package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /direcciones (alta de dirección de envío en el checkout). */
public class DtoPeticionDireccion {
    /** Nombre identificativo de la dirección (p. ej. "Casa", "Trabajo"). */
    @SerializedName("alias")        public final String alias;
    /** Primera línea de la dirección (calle y número). */
    @SerializedName("linea1")       public final String linea1;
    /** Segunda línea de la dirección (piso, puerta, información adicional). */
    @SerializedName("linea2")       public final String linea2;
    /** Ciudad o localidad de la dirección. */
    @SerializedName("ciudad")       public final String ciudad;
    /** Código postal de la dirección. */
    @SerializedName("codigoPostal") public final String codigoPostal;
    /** Provincia de la dirección. */
    @SerializedName("provincia")    public final String provincia;
    /** País de la dirección. */
    @SerializedName("pais")         public final String pais;

    /**
     * Crea la petición para registrar una nueva dirección de envío.
     *
     * @param alias        nombre identificativo de la dirección.
     * @param linea1       calle y número.
     * @param linea2       piso/puerta u otros datos adicionales.
     * @param ciudad       ciudad o localidad.
     * @param codigoPostal código postal.
     * @param provincia    provincia.
     * @param pais         país.
     */
    public DtoPeticionDireccion(String alias, String linea1, String linea2, String ciudad,
                                String codigoPostal, String provincia, String pais) {
        this.alias        = alias;
        this.linea1       = linea1;
        this.linea2       = linea2;
        this.ciudad       = ciudad;
        this.codigoPostal = codigoPostal;
        this.provincia    = provincia;
        this.pais         = pais;
    }
}
