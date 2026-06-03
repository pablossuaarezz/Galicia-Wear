package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /productos/{id}/variantes. */
public class DtoPeticionVariante {
    @SerializedName("talla")
    public final String talla;

    @SerializedName("color")
    public final String color;

    @SerializedName("sku")
    public final String sku;

    @SerializedName("stock")
    public final int stock;

    @SerializedName("ajustePrecio")
    public final double ajustePrecio;

    public DtoPeticionVariante(String talla, String color, String sku,
                               int stock, double ajustePrecio) {
        this.talla        = talla;
        this.color        = color;
        this.sku          = sku;
        this.stock        = stock;
        this.ajustePrecio = ajustePrecio;
    }
}
