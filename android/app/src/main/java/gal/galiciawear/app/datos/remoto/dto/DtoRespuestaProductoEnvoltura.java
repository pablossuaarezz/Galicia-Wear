package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura { "producto": {...} } de POST /productos y PATCH /productos/{id}. */
public class DtoRespuestaProductoEnvoltura {
    @SerializedName("producto")
    public DtoRespuestaProducto producto;
}
