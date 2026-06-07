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
        // Tienda (diseñador) responsable de la línea: permite contactar con ella desde el pedido.
        @SerializedName("disenadorId")  public String disenadorId;
        @SerializedName("disenador")    public DtoDisenadorLinea disenador;

        public static class DtoDisenadorLinea {
            @SerializedName("nombreMarca") public String nombreMarca;
        }

        /** Nombre de la tienda para mostrar (marca), con fallback. */
        public String nombreTienda() {
            if (disenador != null && disenador.nombreMarca != null && !disenador.nombreMarca.isEmpty()) {
                return disenador.nombreMarca;
            }
            return "la tienda";
        }

        /**
         * Nombre legible del producto. El backend lo anida en
         * {@code variante.producto.nombre}; este helper lo resuelve con
         * varios fallbacks para no mostrar "null".
         */
        public String nombreVisible() {
            if (nombreProducto != null && !nombreProducto.isEmpty()) return nombreProducto;
            if (variante != null && variante.producto != null
                    && variante.producto.nombre != null) {
                return variante.producto.nombre;
            }
            return "Artículo";
        }

        /** Subtotal de la línea (precio unitario × cantidad). */
        public double totalLinea() {
            return precioUnitario * cantidad;
        }
    }

    public static class DtoEnvio {
        @SerializedName("id")           public String id;
        @SerializedName("estado")       public String estado;
        @SerializedName("transportista") public String transportista;
        @SerializedName("numeroSeguimiento") public String numeroSeguimiento;
        @SerializedName("ecoEnvio")     public boolean ecoEnvio;
    }
}
