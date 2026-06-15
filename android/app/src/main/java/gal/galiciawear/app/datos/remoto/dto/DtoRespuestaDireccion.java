package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Dirección de envío del cliente — GET /direcciones. */
public class DtoRespuestaDireccion {
    /** Identificador único de la dirección. */
    @SerializedName("id")           public String id;
    /** Alias o nombre descriptivo de la dirección (p. ej. "Casa", "Trabajo"). */
    @SerializedName("alias")        public String alias;
    /** Primera línea de la dirección (calle y número). */
    @SerializedName("linea1")       public String linea1;
    /** Segunda línea de la dirección (piso, puerta, etc.), opcional. */
    @SerializedName("linea2")       public String linea2;
    /** Ciudad o localidad de la dirección. */
    @SerializedName("ciudad")       public String ciudad;
    /** Código postal de la dirección. */
    @SerializedName("codigoPostal") public String codigoPostal;
    /** Provincia de la dirección. */
    @SerializedName("provincia")    public String provincia;
    /** País de la dirección. */
    @SerializedName("pais")         public String pais;

    /** Representación legible para mostrar en el resumen del checkout. */
    public String resumen() {
        StringBuilder sb = new StringBuilder();
        if (linea1 != null) sb.append(linea1);
        if (linea2 != null && !linea2.isEmpty()) sb.append(", ").append(linea2);
        if (codigoPostal != null) sb.append(", ").append(codigoPostal);
        if (ciudad != null) sb.append(" ").append(ciudad);
        return sb.toString();
    }
}
