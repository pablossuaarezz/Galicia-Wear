package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura que devuelve el backend con el historial de pedidos del usuario.
 * El JSON real tiene la forma {@code { "pedidos": [...] }}.
 *
 * Endpoint asociado: GET /pedidos.
 */
public class DtoEnvoltorioListaPedidos {
    /** Lista de pedidos realizados por el usuario. */
    @SerializedName("pedidos")
    public List<DtoRespuestaPedido> pedidos;
}
