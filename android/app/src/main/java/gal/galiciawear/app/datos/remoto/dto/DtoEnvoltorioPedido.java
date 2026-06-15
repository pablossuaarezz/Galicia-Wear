package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Envoltura que devuelve el backend al crear o consultar un pedido individual.
 * El JSON real tiene la forma {@code { "pedido": {...} }}.
 *
 * Endpoints asociados: POST /pedidos (checkout) y GET /pedidos/:id (detalle).
 */
public class DtoEnvoltorioPedido {
    /** Pedido devuelto por el backend (recién creado o consultado por id). */
    @SerializedName("pedido")
    public DtoRespuestaPedido pedido;
}
