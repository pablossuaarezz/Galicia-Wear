package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Producto completo devuelto por GET /productos/:slug */
public class DtoRespuestaProducto {
    @SerializedName("id")
    public String id;

    @SerializedName("nombre")
    public String nombre;

    @SerializedName("slug")
    public String slug;

    @SerializedName("descripcion")
    public String descripcion;

    @SerializedName("precio")
    public double precio;

    // El listado/creación del backend devuelve "precioBase" (Decimal). Lo recogemos
    // aparte para la gestión del diseñador, donde no pasa por el presentador público.
    @SerializedName("precioBase")
    public double precioBase;

    @SerializedName("materialPrincipal")
    public String materialPrincipal;

    @SerializedName("kmOrigen")
    public int kmOrigen;

    @SerializedName("activo")
    public boolean activo;

    @SerializedName("disenadorId")
    public String disenadorId;

    @SerializedName("imagenes")
    public List<DtoImagenProducto> imagenes;

    @SerializedName("variantes")
    public List<DtoVariante> variantes;

    @SerializedName("certificados")
    public List<DtoCertificado> certificados;

    @SerializedName("disenador")
    public DtoDisenadorResumen disenador;

    // ── DTOs anidados ────────────────────────────────────────────────────────

    public static class DtoImagenProducto {
        @SerializedName("id")    public String id;
        @SerializedName("url")   public String url;
        @SerializedName("alt")   public String alt;
        @SerializedName("esPrincipal") public boolean esPrincipal;
    }

    public static class DtoVariante {
        @SerializedName("id")     public String id;
        @SerializedName("talla")  public String talla;
        @SerializedName("color")  public String color;
        @SerializedName("stock")  public int stock;
        @SerializedName("precio") public Double precio;
        // El backend envía el ajuste sobre el precio base del producto (no un precio
        // absoluto). El precio real de la variante = producto.precioBase + ajustePrecio.
        @SerializedName("ajustePrecio") public Double ajustePrecio;
        @SerializedName("sku")    public String sku;
        // En las líneas de pedido el backend anida el producto dentro de la variante.
        @SerializedName("producto") public DtoProductoResumen producto;
    }

    public static class DtoProductoResumen {
        @SerializedName("nombre") public String nombre;
        @SerializedName("slug")   public String slug;
    }

    public static class DtoCertificado {
        @SerializedName("certificado") public DtoCertificadoDetalle certificado;
        public static class DtoCertificadoDetalle {
            @SerializedName("codigo")      public String codigo;
            @SerializedName("nombre")      public String nombre;
            @SerializedName("descripcion") public String descripcion;
        }
    }

    public static class DtoDisenadorResumen {
        @SerializedName("id")        public String id;
        @SerializedName("nombreMarca") public String nombreMarca;
        @SerializedName("ciudad")    public String ciudad;
        @SerializedName("usuario")   public DtoUsuarioResumen usuario;
        public static class DtoUsuarioResumen {
            @SerializedName("nombre")    public String nombre;
            @SerializedName("apellidos") public String apellidos;
        }
    }
}
