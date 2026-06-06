package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Dirección de envío del cliente — GET /direcciones. */
public class DtoRespuestaDireccion {
    @SerializedName("id")           public String id;
    @SerializedName("alias")        public String alias;
    @SerializedName("linea1")       public String linea1;
    @SerializedName("linea2")       public String linea2;
    @SerializedName("ciudad")       public String ciudad;
    @SerializedName("codigoPostal") public String codigoPostal;
    @SerializedName("provincia")    public String provincia;
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
