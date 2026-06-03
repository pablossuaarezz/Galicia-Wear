package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /productos y PATCH /productos/{id}. */
public class DtoPeticionProducto {
    @SerializedName("nombre")
    public final String nombre;

    @SerializedName("descripcion")
    public final String descripcion;

    @SerializedName("precioBase")
    public final double precioBase;

    @SerializedName("kmOrigen")
    public final int kmOrigen;

    @SerializedName("materialPrincipal")
    public final String materialPrincipal;

    public DtoPeticionProducto(String nombre, String descripcion, double precioBase,
                               int kmOrigen, String materialPrincipal) {
        this.nombre            = nombre;
        this.descripcion       = descripcion;
        this.precioBase        = precioBase;
        this.kmOrigen          = kmOrigen;
        this.materialPrincipal = materialPrincipal;
    }
}
