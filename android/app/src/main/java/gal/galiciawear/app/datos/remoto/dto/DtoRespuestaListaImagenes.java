package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura {@code { "imagenes": [...] } } de la respuesta de
 * GET /productos/{id}/imagenes, utilizada en la gestión de fotos de una prenda
 * por parte del diseñador.
 */
public class DtoRespuestaListaImagenes {
    /** Lista de imágenes asociadas al producto. */
    @SerializedName("imagenes")
    public List<DtoImagen> imagenes;
}
