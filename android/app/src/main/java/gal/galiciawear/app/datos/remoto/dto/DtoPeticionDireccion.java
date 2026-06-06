package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /direcciones (alta de dirección de envío en el checkout). */
public class DtoPeticionDireccion {
    @SerializedName("alias")        public final String alias;
    @SerializedName("linea1")       public final String linea1;
    @SerializedName("linea2")       public final String linea2;
    @SerializedName("ciudad")       public final String ciudad;
    @SerializedName("codigoPostal") public final String codigoPostal;
    @SerializedName("provincia")    public final String provincia;
    @SerializedName("pais")         public final String pais;

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
