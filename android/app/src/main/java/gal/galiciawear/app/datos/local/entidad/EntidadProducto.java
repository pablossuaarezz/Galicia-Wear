package gal.galiciawear.app.datos.local.entidad;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import androidx.annotation.NonNull;

/**
 * Entidad Room para la caché offline de productos.
 *
 * JUSTIFICACIÓN: Almacenar los productos más recientes en SQLite local
 * permite mostrar contenido aunque no haya conexión (ley de Fitts: el
 * catálogo debe aparecer de inmediato sin spinners de carga cuando el
 * usuario ya lo vio antes).
 */
@Entity(tableName = "productos_cache")
public class EntidadProducto {

    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "id")
    public String id;

    @ColumnInfo(name = "nombre")
    public String nombre;

    @ColumnInfo(name = "slug")
    public String slug;

    @ColumnInfo(name = "descripcion")
    public String descripcion;

    @ColumnInfo(name = "precio")
    public double precio;

    @ColumnInfo(name = "material_principal")
    public String materialPrincipal;

    @ColumnInfo(name = "km_origen")
    public int kmOrigen;

    /** URL de la imagen principal (precalculada para evitar JSON en Room) */
    @ColumnInfo(name = "url_imagen_principal")
    public String urlImagenPrincipal;

    @ColumnInfo(name = "nombre_marca_disenador")
    public String nombreMarcaDisenador;

    /** Timestamp de cuándo se cacheó — para invalidar entradas > 1 hora */
    @ColumnInfo(name = "fecha_cache")
    public long fechaCache;
}
