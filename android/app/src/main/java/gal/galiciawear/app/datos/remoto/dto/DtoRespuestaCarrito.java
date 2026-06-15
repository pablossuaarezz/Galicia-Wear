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

    /** Identificador único del carrito del usuario. */
    @SerializedName("id")
    public String id;

    /** Líneas del carrito (una por cada variante de producto añadida). */
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

    /** Indica si el carrito no contiene ninguna línea (lista vacía o nula). */
    public boolean estaVacio() {
        return items == null || items.isEmpty();
    }

    /** Línea individual del carrito: una variante de producto y su cantidad. */
    public static class DtoItemCarrito {
        /** Identificador único de la línea del carrito. */
        @SerializedName("id")       public String id;
        /** Número de unidades de esta variante añadidas al carrito. */
        @SerializedName("cantidad") public int cantidad;
        /** Variante de producto asociada a esta línea. */
        @SerializedName("variante") public DtoVarianteCarrito variante;

        /** Precio unitario de la línea, delegado en el cálculo de la variante. */
        public double precioUnitario() {
            return variante != null ? variante.precioUnitario() : 0;
        }

        /** Subtotal de la línea: precio unitario multiplicado por la cantidad. */
        public double subtotal() {
            return precioUnitario() * cantidad;
        }

        /** Datos de la variante (talla/color/stock/precio) tal como se incluyen dentro del carrito. */
        public static class DtoVarianteCarrito {
            /** Identificador único de la variante. */
            @SerializedName("id")           public String id;
            /** Talla de la variante. */
            @SerializedName("talla")        public String talla;
            /** Color de la variante. */
            @SerializedName("color")        public String color;
            /** Unidades disponibles en stock de esta variante. */
            @SerializedName("stock")        public int stock;
            /** Ajuste de precio de la variante respecto al precio base del producto; puede ser null. */
            @SerializedName("ajustePrecio") public Double ajustePrecio;
            /** Producto al que pertenece esta variante. */
            @SerializedName("producto")     public DtoProductoCarrito producto;

            /**
             * Calcula el precio unitario de la variante sumando el precio base
             * del producto y el ajuste de precio de la variante (si lo tiene).
             *
             * @return precio unitario resultante, o 0 si no hay producto asociado.
             */
            public double precioUnitario() {
                double base   = producto != null ? producto.precioBase : 0;
                double ajuste = ajustePrecio != null ? ajustePrecio : 0;
                return base + ajuste;
            }

            /** Datos del producto asociado a la variante, tal como se incluyen dentro del carrito. */
            public static class DtoProductoCarrito {
                /** Identificador único del producto. */
                @SerializedName("id")         public String id;
                /** Nombre del producto. */
                @SerializedName("nombre")     public String nombre;
                /** Slug del producto, usado para navegar a su ficha. */
                @SerializedName("slug")       public String slug;
                /** Precio base del producto (sin aplicar el ajuste de la variante). */
                @SerializedName("precioBase") public double precioBase;
                /** Imágenes del producto. */
                @SerializedName("imagenes")   public List<DtoRespuestaProducto.DtoImagenProducto> imagenes;
                /** Diseñador (marca) que ha publicado el producto. */
                @SerializedName("disenador")  public DtoDisenadorCarrito disenador;

                /**
                 * Devuelve la URL de la primera imagen del producto, usada como
                 * imagen principal en el carrito.
                 *
                 * @return URL de la primera imagen, o null si el producto no tiene imágenes.
                 */
                public String urlImagenPrincipal() {
                    if (imagenes != null && !imagenes.isEmpty()) {
                        return imagenes.get(0).url;
                    }
                    return null;
                }

                /** Datos resumidos del diseñador (marca) propietario del producto. */
                public static class DtoDisenadorCarrito {
                    /** Nombre de la marca del diseñador. */
                    @SerializedName("nombreMarca") public String nombreMarca;
                }
            }
        }
    }
}
