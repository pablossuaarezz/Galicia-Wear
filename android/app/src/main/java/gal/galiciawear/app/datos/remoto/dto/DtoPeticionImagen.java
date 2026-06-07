package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de POST /productos/{id}/imagenes. Admite dos formas:
 *  - {@code url}: una URL de imagen ya existente.
 *  - {@code base64}: una foto elegida en el móvil (data URI), que el backend
 *    guarda como archivo y sirve por URL. Gson omite los campos null, así que
 *    solo se envía el que corresponda.
 */
public class DtoPeticionImagen {
    @SerializedName("url")
    public final String url;

    @SerializedName("base64")
    public final String base64;

    @SerializedName("textoAlternativo")
    public final String textoAlternativo;

    @SerializedName("esPrincipal")
    public final boolean esPrincipal;

    private DtoPeticionImagen(String url, String base64, String textoAlternativo, boolean esPrincipal) {
        this.url              = url;
        this.base64           = base64;
        this.textoAlternativo = textoAlternativo;
        this.esPrincipal      = esPrincipal;
    }

    /** Foto a partir de una URL existente. */
    public static DtoPeticionImagen desdeUrl(String url, String textoAlternativo, boolean esPrincipal) {
        return new DtoPeticionImagen(url, null, textoAlternativo, esPrincipal);
    }

    /** Foto subida desde el móvil como data URI base64. */
    public static DtoPeticionImagen desdeBase64(String base64, String textoAlternativo, boolean esPrincipal) {
        return new DtoPeticionImagen(null, base64, textoAlternativo, esPrincipal);
    }
}
