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
    /** URL de una imagen ya existente (alternativa excluyente con {@link #base64}). */
    @SerializedName("url")
    public final String url;

    /** Foto elegida en el dispositivo, codificada como data URI base64 (alternativa excluyente con {@link #url}). */
    @SerializedName("base64")
    public final String base64;

    /** Texto alternativo (accesibilidad/SEO) de la imagen. */
    @SerializedName("textoAlternativo")
    public final String textoAlternativo;

    /** Indica si esta imagen debe marcarse como la imagen principal del producto. */
    @SerializedName("esPrincipal")
    public final boolean esPrincipal;

    /**
     * Constructor privado de uso interno; las instancias se crean mediante
     * los métodos de fábrica {@link #desdeUrl} o {@link #desdeBase64}, que
     * garantizan que solo uno de {@code url}/{@code base64} tenga valor.
     */
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
