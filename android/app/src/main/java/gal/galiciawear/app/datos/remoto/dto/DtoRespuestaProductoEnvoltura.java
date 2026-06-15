package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Envoltura {@code { "producto": {...} } } que devuelven los endpoints de
 * producto, incluyendo POST /productos, PATCH /productos/{id} y
 * GET /productos/mios/{id}, entre otros.
 */
public class DtoRespuestaProductoEnvoltura {
    /** Producto devuelto por el backend, anidado bajo la clave "producto". */
    @SerializedName("producto")
    public DtoRespuestaProducto producto;
}
