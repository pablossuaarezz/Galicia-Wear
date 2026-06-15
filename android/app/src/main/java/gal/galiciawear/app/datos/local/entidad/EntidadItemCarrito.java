package gal.galiciawear.app.datos.local.entidad;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

/**
 * Caché local del carrito (usado cuando el usuario no está conectado).
 * Cuando recupera la conexión, los cambios se sincronizan con el backend.
 */
@Entity(tableName = "carrito_local")
public class EntidadItemCarrito {

    // Clave primaria: la variante de producto identifica de forma única
    // cada línea del carrito (un mismo producto con distinta talla/color
    // genera filas distintas).
    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "variante_id")
    public String varianteId;

    /** Número de unidades de esta variante en el carrito. */
    @ColumnInfo(name = "cantidad")
    public int cantidad;

    /** Nombre del producto, duplicado aquí para no depender de un JOIN al mostrar la UI. */
    @ColumnInfo(name = "nombre_producto")
    public String nombreProducto;

    /** Talla de la variante (p. ej. "M", "42"). */
    @ColumnInfo(name = "talla")
    public String talla;

    /** Color de la variante. */
    @ColumnInfo(name = "color")
    public String color;

    /** Precio unitario de la variante en el momento en que se añadió al carrito. */
    @ColumnInfo(name = "precio")
    public double precio;

    /** URL (o data URI) de la imagen a mostrar en la línea del carrito. */
    @ColumnInfo(name = "url_imagen")
    public String urlImagen;
}
