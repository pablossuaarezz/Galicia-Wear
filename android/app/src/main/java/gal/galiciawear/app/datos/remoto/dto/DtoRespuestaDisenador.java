package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura { "disenador": {...} } que devuelven los endpoints de diseñador. */
public class DtoRespuestaDisenador {
    @SerializedName("disenador")
    public DtoDisenador disenador;
}
