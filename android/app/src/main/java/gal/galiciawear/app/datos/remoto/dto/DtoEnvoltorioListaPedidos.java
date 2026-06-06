package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura {@code { "pedidos": [...] }} de GET /pedidos. */
public class DtoEnvoltorioListaPedidos {
    @SerializedName("pedidos")
    public List<DtoRespuestaPedido> pedidos;
}
