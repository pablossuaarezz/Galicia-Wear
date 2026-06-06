package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Carrito del usuario autenticado.
 *
 * El backend lo devuelve envuelto en {@code { "carrito": {...} }} — ver
 * {@link DtoEnvoltorioCarrito}. Además, el backend NO envía ni el total ni el
 * precio unitario: el precio de cada línea se calcula en cliente como
 * {@code producto.precioBase + variante.ajustePrecio}. Centralizar ese cálculo
 * aquí evita duplicarlo (y desincronizarlo) entre adaptador, pie y badge.
 */
public class DtoRespuestaCarrito {

    @SerializedName("id")
    public String id;

    @SerializedName("items")
    public List<DtoItemCarrito> items;

    /** Total del carrito (suma de subtotales). Calculado en cliente. */
    public double calcularTotal() {
        double total = 0;
        if (items != null) {
            for (DtoItemCarrito item : items) {
                total += item.subtotal();
            }
        }
        return total;
    }

    /** Suma de unidades de todas las líneas (lo que muestra el badge). */
    public int totalUnidades() {
        int unidades = 0;
        if (items != null) {
            for (DtoItemCarrito item : items) {
                unidades += item.cantidad;
            }
        }
        return unidades;
    }

    public boolean estaVacio() {
        return items == null || items.isEmpty();
    }

    public static class DtoItemCarrito {
        @SerializedName("id")       public String id;
        @SerializedName("cantidad") public int cantidad;
        @SerializedName("variante") public DtoVarianteCarrito variante;

        public double precioUnitario() {
            return variante != null ? variante.precioUnitario() : 0;
        }

        public double subtotal() {
            return precioUnitario() * cantidad;
        }

        public static class DtoVarianteCarrito {
            @SerializedName("id")           public String id;
            @SerializedName("talla")        public String talla;
            @SerializedName("color")        public String color;
            @SerializedName("stock")        public int stock;
            @SerializedName("ajustePrecio") public Double ajustePrecio;
            @SerializedName("producto")     public DtoProductoCarrito producto;

            public double precioUnitario() {
                double base   = producto != null ? producto.precioBase : 0;
                double ajuste = ajustePrecio != null ? ajustePrecio : 0;
                return base + ajuste;
            }

            public static class DtoProductoCarrito {
                @SerializedName("id")         public String id;
                @SerializedName("nombre")     public String nombre;
                @SerializedName("slug")       public String slug;
                @SerializedName("precioBase") public double precioBase;
                @SerializedName("imagenes")   public List<DtoRespuestaProducto.DtoImagenProducto> imagenes;
                @SerializedName("disenador")  public DtoDisenadorCarrito disenador;

                public String urlImagenPrincipal() {
                    if (imagenes != null && !imagenes.isEmpty()) {
                        return imagenes.get(0).url;
                    }
                    return null;
                }

                public static class DtoDisenadorCarrito {
                    @SerializedName("nombreMarca") public String nombreMarca;
                }
            }
        }
    }
}
