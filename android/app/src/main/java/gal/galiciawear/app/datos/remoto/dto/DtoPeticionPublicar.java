package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo parcial de PATCH /productos/{id} para publicar o despublicar una prenda.
 * El backend acepta actualizaciones parciales, así que solo enviamos `activo`.
 */
public class DtoPeticionPublicar {
    /** {@code true} para publicar (mostrar) el producto; {@code false} para despublicarlo. */
    @SerializedName("activo")
    public final boolean activo;

    /**
     * Crea la petición parcial para cambiar el estado de publicación del producto.
     *
     * @param activo {@code true} para publicar el producto, {@code false} para despublicarlo.
     */
    public DtoPeticionPublicar(boolean activo) {
        this.activo = activo;
    }
}
