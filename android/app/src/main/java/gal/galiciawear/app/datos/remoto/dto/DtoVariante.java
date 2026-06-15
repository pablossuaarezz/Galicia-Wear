package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Variante (talla/color) de un producto, tal como la devuelve el backend en
 * GET /productos/{id}/variantes (envuelta en {@link DtoRespuestaListaVariantes}).
 */
public class DtoVariante {
    /** Identificador único de la variante. */
    @SerializedName("id")
    public String id;

    /** Talla de la variante (p. ej. "S", "M", "L", "42"). */
    @SerializedName("talla")
    public String talla;

    /** Color de la variante. */
    @SerializedName("color")
    public String color;

    /** Código SKU (identificador interno de inventario) de la variante. */
    @SerializedName("sku")
    public String sku;

    /** Unidades disponibles en stock para esta variante. */
    @SerializedName("stock")
    public int stock;

    /**
     * Ajuste de precio respecto al precio base del producto. El precio final
     * de la variante se calcula como {@code producto.precioBase + ajustePrecio}.
     */
    @SerializedName("ajustePrecio")
    public double ajustePrecio;
}
