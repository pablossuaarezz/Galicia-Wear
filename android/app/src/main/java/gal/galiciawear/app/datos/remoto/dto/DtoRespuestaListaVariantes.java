package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura { "variantes": [...] } de GET /productos/{id}/variantes. */
public class DtoRespuestaListaVariantes {
    @SerializedName("variantes")
    public List<DtoVariante> variantes;
}
