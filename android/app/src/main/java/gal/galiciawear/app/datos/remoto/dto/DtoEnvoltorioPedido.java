package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Envoltura {@code { "pedido": {...} }} de POST /pedidos y GET /pedidos/:id. */
public class DtoEnvoltorioPedido {
    @SerializedName("pedido")
    public DtoRespuestaPedido pedido;
}
