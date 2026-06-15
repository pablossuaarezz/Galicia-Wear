package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de la petición POST /productos/{id}/variantes, usada por el diseñador
 * para añadir una nueva variante (combinación de talla/color) a una prenda.
 */
public class DtoPeticionVariante {
    /** Talla de la variante (p. ej. "S", "M", "L", "42"). */
    @SerializedName("talla")
    public final String talla;

    /** Color de la variante. */
    @SerializedName("color")
    public final String color;

    /** Código SKU (identificador interno de inventario) de la variante. */
    @SerializedName("sku")
    public final String sku;

    /** Unidades disponibles en stock para esta variante. */
    @SerializedName("stock")
    public final int stock;

    /**
     * Ajuste de precio respecto al precio base del producto (puede ser
     * positivo o negativo). El precio final de la variante se calcula como
     * {@code producto.precioBase + ajustePrecio}.
     */
    @SerializedName("ajustePrecio")
    public final double ajustePrecio;

    /**
     * Crea la petición de creación de una nueva variante para una prenda.
     *
     * @param talla        talla de la variante.
     * @param color        color de la variante.
     * @param sku          código SKU de inventario.
     * @param stock        unidades disponibles.
     * @param ajustePrecio ajuste de precio respecto al precio base del producto.
     */
    public DtoPeticionVariante(String talla, String color, String sku,
                               int stock, double ajustePrecio) {
        this.talla        = talla;
        this.color        = color;
        this.sku          = sku;
        this.stock        = stock;
        this.ajustePrecio = ajustePrecio;
    }
}
