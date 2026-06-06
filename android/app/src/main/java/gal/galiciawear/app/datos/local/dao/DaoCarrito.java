package gal.galiciawear.app.datos.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;

@Dao
public interface DaoCarrito {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertar(EntidadItemCarrito item);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertarTodos(List<EntidadItemCarrito> items);

    /** Reemplaza por completo la caché local con el carrito recibido del backend. */
    @Transaction
    default void reemplazar(List<EntidadItemCarrito> items) {
        vaciar();
        if (items != null && !items.isEmpty()) {
            insertarTodos(items);
        }
    }

    @Query("SELECT * FROM carrito_local")
    LiveData<List<EntidadItemCarrito>> observarItems();

    @Query("SELECT * FROM carrito_local")
    List<EntidadItemCarrito> obtenerItems();

    @Query("DELETE FROM carrito_local WHERE variante_id = :varianteId")
    void eliminar(String varianteId);

    @Query("DELETE FROM carrito_local")
    void vaciar();

    /** Badge: suma de unidades (no número de líneas). COALESCE evita null con carrito vacío. */
    @Query("SELECT COALESCE(SUM(cantidad), 0) FROM carrito_local")
    LiveData<Integer> contarItems();
}
