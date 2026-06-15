package gal.galiciawear.app.datos.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;

/**
 * DAO (Data Access Object) Room para la caché local del carrito.
 * Room genera la implementación de esta interfaz en tiempo de compilación
 * a partir de las anotaciones @Insert/@Query/@Transaction.
 */
@Dao
public interface DaoCarrito {

    /**
     * Inserta o actualiza un ítem del carrito.
     * OnConflictStrategy.REPLACE: si ya existe una fila con la misma clave
     * primaria (varianteId), se sobrescribe en lugar de lanzar un error.
     *
     * @param item ítem de carrito a guardar/actualizar.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertar(EntidadItemCarrito item);

    /**
     * Inserta o actualiza varios ítems de carrito en una sola operación.
     *
     * @param items lista de ítems a guardar/actualizar.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertarTodos(List<EntidadItemCarrito> items);

    /**
     * Reemplaza por completo la caché local con el carrito recibido del backend.
     *
     * @Transaction asegura que el borrado (vaciar) y la reinserción se ejecuten
     * de forma atómica: si la app se interrumpe a mitad, la BD no queda en un
     * estado intermedio (carrito vacío sin haberse repoblado).
     *
     * @param items ítems actuales del carrito según el backend; puede ser
     *              null o vacío, en cuyo caso la caché queda simplemente vacía.
     */
    @Transaction
    default void reemplazar(List<EntidadItemCarrito> items) {
        vaciar();
        if (items != null && !items.isEmpty()) {
            insertarTodos(items);
        }
    }

    /**
     * Observa los ítems del carrito local. Al ser LiveData, Room notifica
     * automáticamente a los observers cada vez que cambia la tabla
     * "carrito_local", sin necesidad de consultas manuales repetidas.
     *
     * @return LiveData con la lista actual de ítems del carrito.
     */
    @Query("SELECT * FROM carrito_local")
    LiveData<List<EntidadItemCarrito>> observarItems();

    /**
     * Obtiene de forma síncrona (no observable) los ítems actuales del carrito.
     * Útil para operaciones puntuales fuera del hilo principal.
     *
     * @return lista actual de ítems del carrito.
     */
    @Query("SELECT * FROM carrito_local")
    List<EntidadItemCarrito> obtenerItems();

    /**
     * Elimina del carrito local el ítem correspondiente a una variante concreta.
     *
     * @param varianteId identificador de la variante de producto a eliminar.
     */
    @Query("DELETE FROM carrito_local WHERE variante_id = :varianteId")
    void eliminar(String varianteId);

    /** Elimina todos los ítems del carrito local (vacía la tabla por completo). */
    @Query("DELETE FROM carrito_local")
    void vaciar();

    /**
     * Badge: suma de unidades (no número de líneas). COALESCE evita null con carrito vacío.
     *
     * @return LiveData con el número total de unidades en el carrito (0 si está vacío).
     */
    @Query("SELECT COALESCE(SUM(cantidad), 0) FROM carrito_local")
    LiveData<Integer> contarItems();
}
