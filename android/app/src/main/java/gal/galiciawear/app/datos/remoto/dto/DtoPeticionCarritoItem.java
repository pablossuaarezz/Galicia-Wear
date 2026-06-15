package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo de POST /carrito/items — petición para añadir una unidad de producto
 * (identificada por su variante de talla/color) al carrito del usuario.
 */
public class DtoPeticionCarritoItem {
    /** Identificador de la variante (talla/color) del producto que se añade al carrito. */
    @SerializedName("varianteId")
    public final String varianteId;

    /** Cantidad de unidades que se desean añadir. */
    @SerializedName("cantidad")
    public final int cantidad;

    /**
     * Crea la petición para añadir un artículo al carrito.
     *
     * @param varianteId identificador de la variante del producto.
     * @param cantidad   número de unidades a añadir.
     */
    public DtoPeticionCarritoItem(String varianteId, int cantidad) {
        this.varianteId = varianteId;
        this.cantidad   = cantidad;
    }
}
