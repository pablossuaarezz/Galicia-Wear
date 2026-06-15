package gal.galiciawear.app.datos.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

import gal.galiciawear.app.datos.local.entidad.EntidadProducto;

/**
 * DAO de productos Room.
 * JUSTIFICACIÓN: Los métodos con LiveData<> son observados automáticamente
 * por Room — cuando cambia la tabla, Room notifica al observer sin polling.
 */
@Dao
public interface DaoProducto {

    /**
     * Inserta o actualiza productos en la caché local.
     * OnConflictStrategy.REPLACE sobrescribe los productos que ya existan
     * (misma clave primaria "id") con los datos más recientes.
     *
     * @param productos lista de productos a cachear.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertarTodos(List<EntidadProducto> productos);

    /**
     * Observa todos los productos cacheados, ordenados por fecha de caché
     * descendente (los más recientes primero).
     *
     * @return LiveData con la lista de productos cacheados.
     */
    @Query("SELECT * FROM productos_cache ORDER BY fecha_cache DESC")
    LiveData<List<EntidadProducto>> observarTodos();

    /**
     * Busca un producto cacheado por su identificador.
     *
     * @param id identificador del producto.
     * @return el producto si está en caché, o null si no existe.
     */
    @Query("SELECT * FROM productos_cache WHERE id = :id LIMIT 1")
    EntidadProducto obtenerPorId(String id);

    /**
     * Busca un producto cacheado por su slug (identificador legible usado en URLs).
     *
     * @param slug slug del producto.
     * @return el producto si está en caché, o null si no existe.
     */
    @Query("SELECT * FROM productos_cache WHERE slug = :slug LIMIT 1")
    EntidadProducto obtenerPorSlug(String slug);

    /**
     * Invalida la caché: borra productos más antiguos que timestampLimite.
     *
     * @param timestampLimite marca de tiempo (epoch millis); se eliminan los
     *                         productos cuyo "fecha_cache" sea anterior a esta.
     */
    @Query("DELETE FROM productos_cache WHERE fecha_cache < :timestampLimite")
    void borrarCacheAntigua(long timestampLimite);

    /** Elimina todos los productos cacheados (vacía la tabla por completo). */
    @Query("DELETE FROM productos_cache")
    void borrarTodo();
}
