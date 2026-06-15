package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Producto completo devuelto por GET /productos/:slug (envuelto en
 * {@link DtoRespuestaProductoEnvoltura} en algunos endpoints) y dentro de
 * {@link DtoRespuestaListaProductos}. Incluye todos los datos de la prenda:
 * descripción, precio, imágenes, variantes, certificados de sostenibilidad
 * y datos del diseñador.
 */
public class DtoRespuestaProducto {
    /** Identificador único del producto. */
    @SerializedName("id")
    public String id;

    /** Nombre del producto/prenda. */
    @SerializedName("nombre")
    public String nombre;

    /** Slug (identificador legible en URL) del producto. */
    @SerializedName("slug")
    public String slug;

    /** Descripción detallada del producto. */
    @SerializedName("descripcion")
    public String descripcion;

    /** Precio del producto tal como se presenta al público. */
    @SerializedName("precio")
    public double precio;

    // El listado/creación del backend devuelve "precioBase" (Decimal). Lo recogemos
    // aparte para la gestión del diseñador, donde no pasa por el presentador público.
    /**
     * Precio base del producto (sin ajustes de variante), tal como lo devuelve
     * el backend en el listado/creación. Se usa en la gestión del diseñador.
     */
    @SerializedName("precioBase")
    public double precioBase;

    /** Material principal con el que está fabricado el producto. */
    @SerializedName("materialPrincipal")
    public String materialPrincipal;

    /** Kilómetros de origen del producto (indicador de sostenibilidad). */
    @SerializedName("kmOrigen")
    public int kmOrigen;

    /** Indica si el producto está publicado (visible para los clientes). */
    @SerializedName("activo")
    public boolean activo;

    /** Identificador del diseñador propietario del producto. */
    @SerializedName("disenadorId")
    public String disenadorId;

    /** Imágenes asociadas al producto. */
    @SerializedName("imagenes")
    public List<DtoImagenProducto> imagenes;

    /** Variantes (talla/color) disponibles del producto. */
    @SerializedName("variantes")
    public List<DtoVariante> variantes;

    /** Certificados de sostenibilidad asociados al producto. */
    @SerializedName("certificados")
    public List<DtoCertificado> certificados;

    /** Datos resumidos del diseñador (marca) que ha publicado el producto. */
    @SerializedName("disenador")
    public DtoDisenadorResumen disenador;

    // ── DTOs anidados ────────────────────────────────────────────────────────

    /** Imagen asociada a un producto. */
    public static class DtoImagenProducto {
        /** Identificador único de la imagen. */
        @SerializedName("id")    public String id;
        /** URL de la imagen. */
        @SerializedName("url")   public String url;
        /** Texto alternativo de la imagen (accesibilidad). */
        @SerializedName("alt")   public String alt;
        /** Indica si esta es la imagen principal del producto. */
        @SerializedName("esPrincipal") public boolean esPrincipal;
    }

    /** Variante (talla/color) de un producto, dentro de la respuesta de producto. */
    public static class DtoVariante {
        /** Identificador único de la variante. */
        @SerializedName("id")     public String id;
        /** Talla de la variante. */
        @SerializedName("talla")  public String talla;
        /** Color de la variante. */
        @SerializedName("color")  public String color;
        /** Unidades disponibles en stock de esta variante. */
        @SerializedName("stock")  public int stock;
        /** Precio absoluto de la variante, si el backend lo proporciona directamente; puede ser null. */
        @SerializedName("precio") public Double precio;
        // El backend envía el ajuste sobre el precio base del producto (no un precio
        // absoluto). El precio real de la variante = producto.precioBase + ajustePrecio.
        /**
         * Ajuste de precio sobre el precio base del producto (no es un precio
         * absoluto). El precio real de la variante es
         * {@code producto.precioBase + ajustePrecio}. Puede ser null.
         */
        @SerializedName("ajustePrecio") public Double ajustePrecio;
        /** Código SKU (identificador interno de inventario) de la variante. */
        @SerializedName("sku")    public String sku;
        // En las líneas de pedido el backend anida el producto dentro de la variante.
        /** Producto al que pertenece la variante (anidado en las líneas de pedido). */
        @SerializedName("producto") public DtoProductoResumen producto;
    }

    /** Datos mínimos de un producto, usados cuando viene anidado dentro de una variante. */
    public static class DtoProductoResumen {
        /** Nombre del producto. */
        @SerializedName("nombre") public String nombre;
        /** Slug del producto, usado para navegar a su ficha. */
        @SerializedName("slug")   public String slug;
    }

    /** Certificado de sostenibilidad asociado a un producto. */
    public static class DtoCertificado {
        /** Detalle del certificado, anidado bajo la clave "certificado". */
        @SerializedName("certificado") public DtoCertificadoDetalle certificado;
        /** Información descriptiva de un certificado de sostenibilidad. */
        public static class DtoCertificadoDetalle {
            /** Código identificativo del certificado. */
            @SerializedName("codigo")      public String codigo;
            /** Nombre del certificado. */
            @SerializedName("nombre")      public String nombre;
            /** Descripción del certificado. */
            @SerializedName("descripcion") public String descripcion;
        }
    }

    /** Datos resumidos del diseñador (marca) propietario de un producto. */
    public static class DtoDisenadorResumen {
        /** Identificador único del diseñador. */
        @SerializedName("id")        public String id;
        /** Nombre de la marca del diseñador. */
        @SerializedName("nombreMarca") public String nombreMarca;
        /** Ciudad en la que se ubica el diseñador. */
        @SerializedName("ciudad")    public String ciudad;
        /** Datos resumidos del usuario asociado al diseñador. */
        @SerializedName("usuario")   public DtoUsuarioResumen usuario;
        /** Datos mínimos del usuario (persona) detrás del perfil de diseñador. */
        public static class DtoUsuarioResumen {
            /** Nombre del usuario. */
            @SerializedName("nombre")    public String nombre;
            /** Apellidos del usuario. */
            @SerializedName("apellidos") public String apellidos;
        }
    }
}
