package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Pedido completo — GET /pedidos/:id y POST /pedidos */
public class DtoRespuestaPedido {
    /** Identificador único del pedido. */
    @SerializedName("id")
    public String id;

    /** Número de pedido visible para el usuario (referencia legible). */
    @SerializedName("numeroPedido")
    public String numeroPedido;

    /** Estado actual del pedido (p. ej. "PENDIENTE", "PAGADO", "CANCELADO"). */
    @SerializedName("estado")
    public String estado;

    /** Importe total del pedido. */
    @SerializedName("total")
    public double total;

    /** Método de pago utilizado para el pedido. */
    @SerializedName("metodoPago")
    public String metodoPago;

    /** Fecha de creación del pedido, en el formato proporcionado por el backend. */
    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    /** Líneas (artículos) que componen el pedido. */
    @SerializedName("lineas")
    public List<DtoLineaPedido> lineas;

    /** Información de envío asociada al pedido. */
    @SerializedName("envio")
    public DtoEnvio envio;

    /** Línea individual de un pedido: una variante de producto, su cantidad y precio. */
    public static class DtoLineaPedido {
        /** Identificador único de la línea de pedido. */
        @SerializedName("id")           public String id;
        /** Número de unidades de la variante incluidas en esta línea. */
        @SerializedName("cantidad")     public int cantidad;
        /** Precio unitario aplicado en el momento de la compra. */
        @SerializedName("precioUnitario") public double precioUnitario;
        /** Estado de esta línea concreta del pedido (puede diferir del estado global). */
        @SerializedName("estadoLinea")  public String estadoLinea;
        /** Variante de producto comprada en esta línea. */
        @SerializedName("variante")     public DtoRespuestaProducto.DtoVariante variante;
        /** Nombre del producto en el momento de la compra (puede venir directamente del backend). */
        @SerializedName("nombreProducto") public String nombreProducto;
        // Tienda (diseñador) responsable de la línea: permite contactar con ella desde el pedido.
        /** Identificador del diseñador (tienda) responsable de esta línea del pedido. */
        @SerializedName("disenadorId")  public String disenadorId;
        /** Datos resumidos del diseñador (tienda) responsable de esta línea. */
        @SerializedName("disenador")    public DtoDisenadorLinea disenador;

        /** Datos resumidos del diseñador (marca) responsable de una línea de pedido. */
        public static class DtoDisenadorLinea {
            /** Nombre de la marca del diseñador. */
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

    /** Información de envío de un pedido. */
    public static class DtoEnvio {
        /** Identificador único del envío. */
        @SerializedName("id")           public String id;
        /** Estado del envío (p. ej. "PREPARANDO", "ENVIADO", "ENTREGADO"). */
        @SerializedName("estado")       public String estado;
        /** Empresa transportista encargada del envío. */
        @SerializedName("transportista") public String transportista;
        /** Número de seguimiento proporcionado por el transportista. */
        @SerializedName("numeroSeguimiento") public String numeroSeguimiento;
        /** Indica si el envío se ha realizado con la opción ecológica (sostenible). */
        @SerializedName("ecoEnvio")     public boolean ecoEnvio;
    }
}
