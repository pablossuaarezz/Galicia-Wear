package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /carrito/items */
public class DtoPeticionCarritoItem {
    @SerializedName("varianteId")
    public final String varianteId;

    @SerializedName("cantidad")
    public final int cantidad;

    public DtoPeticionCarritoItem(String varianteId, int cantidad) {
        this.varianteId = varianteId;
        this.cantidad   = cantidad;
    }
}
