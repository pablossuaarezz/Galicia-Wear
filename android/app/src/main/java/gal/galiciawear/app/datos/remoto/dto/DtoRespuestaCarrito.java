package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Carrito del usuario autenticado — GET /carrito */
public class DtoRespuestaCarrito {
    @SerializedName("id")
    public String id;

    @SerializedName("items")
    public List<DtoItemCarrito> items;

    @SerializedName("total")
    public double total;

    public static class DtoItemCarrito {
        @SerializedName("id")       public String id;
        @SerializedName("cantidad") public int cantidad;
        @SerializedName("variante") public DtoVarianteCarrito variante;

        public static class DtoVarianteCarrito {
            @SerializedName("id")        public String id;
            @SerializedName("talla")     public String talla;
            @SerializedName("color")     public String color;
            @SerializedName("stock")     public int stock;
            @SerializedName("precio")    public Double precio;
            @SerializedName("producto")  public DtoProductoCarrito producto;

            public static class DtoProductoCarrito {
                @SerializedName("id")     public String id;
                @SerializedName("nombre") public String nombre;
                @SerializedName("precio") public double precio;
                @SerializedName("slug")   public String slug;
                @SerializedName("imagenes") public List<DtoRespuestaProducto.DtoImagenProducto> imagenes;
            }
        }
    }
}
