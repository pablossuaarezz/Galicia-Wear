package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura { "imagenes": [...] } de GET /productos/{id}/imagenes. */
public class DtoRespuestaListaImagenes {
    @SerializedName("imagenes")
    public List<DtoImagen> imagenes;
}
