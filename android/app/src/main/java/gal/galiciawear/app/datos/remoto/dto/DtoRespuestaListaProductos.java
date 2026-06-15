package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Página de resultados del endpoint GET /productos (y de GET /productos/mios).
 * El backend pagina los resultados, devolviendo además del listado los datos
 * necesarios para construir la paginación en la interfaz.
 */
public class DtoRespuestaListaProductos {
    /** Listado de productos de la página actual. */
    @SerializedName("datos")
    public List<DtoRespuestaProducto> datos;

    /** Número total de productos que cumplen los filtros (todas las páginas). */
    @SerializedName("total")
    public int total;

    /** Número de página actual (empezando normalmente en 1). */
    @SerializedName("pagina")
    public int pagina;

    /** Tamaño de página, es decir, número máximo de elementos por página. */
    @SerializedName("tamano")
    public int tamano;
}
