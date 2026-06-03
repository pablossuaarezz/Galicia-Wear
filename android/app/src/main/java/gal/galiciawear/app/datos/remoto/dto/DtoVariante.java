package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Variante (talla/color) de un producto, tal como la devuelve el backend. */
public class DtoVariante {
    @SerializedName("id")
    public String id;

    @SerializedName("talla")
    public String talla;

    @SerializedName("color")
    public String color;

    @SerializedName("sku")
    public String sku;

    @SerializedName("stock")
    public int stock;

    @SerializedName("ajustePrecio")
    public double ajustePrecio;
}
