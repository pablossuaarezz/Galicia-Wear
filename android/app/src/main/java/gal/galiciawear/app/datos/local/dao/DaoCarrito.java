package gal.galiciawear.app.datos.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;

@Dao
public interface DaoCarrito {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertar(EntidadItemCarrito item);

    @Query("SELECT * FROM carrito_local")
    LiveData<List<EntidadItemCarrito>> observarItems();

    @Query("SELECT * FROM carrito_local")
    List<EntidadItemCarrito> obtenerItems();

    @Query("DELETE FROM carrito_local WHERE variante_id = :varianteId")
    void eliminar(String varianteId);

    @Query("DELETE FROM carrito_local")
    void vaciar();

    @Query("SELECT COUNT(*) FROM carrito_local")
    LiveData<Integer> contarItems();
}
