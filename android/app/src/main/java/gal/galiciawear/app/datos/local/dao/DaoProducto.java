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

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertarTodos(List<EntidadProducto> productos);

    @Query("SELECT * FROM productos_cache ORDER BY fecha_cache DESC")
    LiveData<List<EntidadProducto>> observarTodos();

    @Query("SELECT * FROM productos_cache WHERE id = :id LIMIT 1")
    EntidadProducto obtenerPorId(String id);

    @Query("SELECT * FROM productos_cache WHERE slug = :slug LIMIT 1")
    EntidadProducto obtenerPorSlug(String slug);

    /** Invalida la caché: borra productos más antiguos que timestampLimite */
    @Query("DELETE FROM productos_cache WHERE fecha_cache < :timestampLimite")
    void borrarCacheAntigua(long timestampLimite);

    @Query("DELETE FROM productos_cache")
    void borrarTodo();
}
