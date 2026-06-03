package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /productos/{id}/imagenes. La foto se guarda en SQL como URL. */
public class DtoPeticionImagen {
    @SerializedName("url")
    public final String url;

    @SerializedName("textoAlternativo")
    public final String textoAlternativo;

    @SerializedName("esPrincipal")
    public final boolean esPrincipal;

    public DtoPeticionImagen(String url, String textoAlternativo, boolean esPrincipal) {
        this.url              = url;
        this.textoAlternativo = textoAlternativo;
        this.esPrincipal      = esPrincipal;
    }
}
