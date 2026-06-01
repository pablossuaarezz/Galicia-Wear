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

    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "variante_id")
    public String varianteId;

    @ColumnInfo(name = "cantidad")
    public int cantidad;

    @ColumnInfo(name = "nombre_producto")
    public String nombreProducto;

    @ColumnInfo(name = "talla")
    public String talla;

    @ColumnInfo(name = "color")
    public String color;

    @ColumnInfo(name = "precio")
    public double precio;

    @ColumnInfo(name = "url_imagen")
    public String urlImagen;
}
