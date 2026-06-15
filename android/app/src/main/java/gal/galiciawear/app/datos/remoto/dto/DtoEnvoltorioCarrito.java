package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Envoltura genérica que devuelve el backend para las operaciones sobre el
 * carrito de la compra. El JSON real tiene la forma {@code { "carrito": {...} }},
 * por lo que esta clase solo sirve para "desenvolver" el objeto interno.
 *
 * Endpoints asociados: GET/POST/DELETE /carrito.
 */
public class DtoEnvoltorioCarrito {
    /** Contenido real del carrito devuelto por el backend. */
    @SerializedName("carrito")
    public DtoRespuestaCarrito carrito;
}
