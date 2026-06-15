package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura {@code { "variantes": [...] } } de la respuesta de
 * GET /productos/{id}/variantes, usada para listar las combinaciones de
 * talla/color disponibles de una prenda.
 */
public class DtoRespuestaListaVariantes {
    /** Lista de variantes (talla/color) del producto. */
    @SerializedName("variantes")
    public List<DtoVariante> variantes;
}
