package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Imagen de un producto almacenada en la base de datos SQL como URL, tal
 * como la devuelve el backend. Se utiliza en la gestión de imágenes de
 * productos por parte del diseñador.
 *
 * Endpoint asociado: GET /productos/{id}/imagenes (a través de
 * {@link DtoRespuestaListaImagenes}).
 */
public class DtoImagen {
    /** Identificador único de la imagen. */
    @SerializedName("id")
    public String id;

    /** URL desde la que se puede descargar/mostrar la imagen. */
    @SerializedName("url")
    public String url;

    /** Texto alternativo (accesibilidad/SEO) asociado a la imagen. */
    @SerializedName("textoAlternativo")
    public String textoAlternativo;

    /** Posición/orden de la imagen dentro de la galería del producto. */
    @SerializedName("posicion")
    public int posicion;

    /** Indica si esta imagen es la imagen principal/destacada del producto. */
    @SerializedName("esPrincipal")
    public boolean esPrincipal;
}
