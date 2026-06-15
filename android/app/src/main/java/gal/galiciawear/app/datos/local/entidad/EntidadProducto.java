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

    /** Identificador único del producto (clave primaria, viene del backend). */
    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "id")
    public String id;

    /** Nombre comercial del producto. */
    @ColumnInfo(name = "nombre")
    public String nombre;

    /** Slug (identificador legible usado en la URL/detalle del producto). */
    @ColumnInfo(name = "slug")
    public String slug;

    /** Descripción textual del producto. */
    @ColumnInfo(name = "descripcion")
    public String descripcion;

    /** Precio de venta del producto. */
    @ColumnInfo(name = "precio")
    public double precio;

    /** Material principal con el que está fabricado (criterio de sostenibilidad). */
    @ColumnInfo(name = "material_principal")
    public String materialPrincipal;

    /** Distancia en kilómetros desde el origen de fabricación (km de proximidad). */
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
