package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /productos y PATCH /productos/{id}. */
public class DtoPeticionProducto {
    /** Nombre del producto/prenda. */
    @SerializedName("nombre")
    public final String nombre;

    /** Descripción detallada del producto. */
    @SerializedName("descripcion")
    public final String descripcion;

    /** Precio base del producto (sin tener en cuenta ajustes de variantes). */
    @SerializedName("precioBase")
    public final double precioBase;

    /** Kilómetros de origen del producto (distancia de fabricación/transporte, usado para el indicador de sostenibilidad). */
    @SerializedName("kmOrigen")
    public final int kmOrigen;

    /** Material principal con el que está fabricado el producto. */
    @SerializedName("materialPrincipal")
    public final String materialPrincipal;

    /**
     * Crea la petición de creación o edición de un producto.
     *
     * @param nombre            nombre del producto.
     * @param descripcion       descripción del producto.
     * @param precioBase        precio base del producto.
     * @param kmOrigen          kilómetros de origen del producto.
     * @param materialPrincipal material principal de fabricación.
     */
    public DtoPeticionProducto(String nombre, String descripcion, double precioBase,
                               int kmOrigen, String materialPrincipal) {
        this.nombre            = nombre;
        this.descripcion       = descripcion;
        this.precioBase        = precioBase;
        this.kmOrigen          = kmOrigen;
        this.materialPrincipal = materialPrincipal;
    }
}
