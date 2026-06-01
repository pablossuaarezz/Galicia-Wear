package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Pedido completo — GET /pedidos/:id y POST /pedidos */
public class DtoRespuestaPedido {
    @SerializedName("id")
    public String id;

    @SerializedName("numeroPedido")
    public String numeroPedido;

    @SerializedName("estado")
    public String estado;

    @SerializedName("total")
    public double total;

    @SerializedName("metodoPago")
    public String metodoPago;

    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    @SerializedName("lineas")
    public List<DtoLineaPedido> lineas;

    @SerializedName("envio")
    public DtoEnvio envio;

    public static class DtoLineaPedido {
        @SerializedName("id")           public String id;
        @SerializedName("cantidad")     public int cantidad;
        @SerializedName("precioUnitario") public double precioUnitario;
        @SerializedName("estadoLinea")  public String estadoLinea;
        @SerializedName("variante")     public DtoRespuestaProducto.DtoVariante variante;
        @SerializedName("nombreProducto") public String nombreProducto;
    }

    public static class DtoEnvio {
        @SerializedName("id")           public String id;
        @SerializedName("estado")       public String estado;
        @SerializedName("transportista") public String transportista;
        @SerializedName("numeroSeguimiento") public String numeroSeguimiento;
        @SerializedName("ecoEnvio")     public boolean ecoEnvio;
    }
}
