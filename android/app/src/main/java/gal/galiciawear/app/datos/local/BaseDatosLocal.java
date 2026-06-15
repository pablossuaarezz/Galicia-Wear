package gal.galiciawear.app.datos.local;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import gal.galiciawear.app.datos.local.dao.DaoCarrito;
import gal.galiciawear.app.datos.local.dao.DaoProducto;
import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;
import gal.galiciawear.app.datos.local.entidad.EntidadProducto;

/**
 * Base de datos Room de GaliciaWear.
 *
 * JUSTIFICACIÓN: exportSchema = false simplifica el TFG (sin fichero de migración
 * en el repo). En producción se exportaría y se añadirían migraciones por versión.
 * El patrón Singleton con doble comprobación es el recomendado por la doc oficial
 * de Room para evitar crear múltiples instancias del mismo fichero SQLite.
 */
@Database(
    entities = { EntidadProducto.class, EntidadItemCarrito.class },
    version = 1,
    exportSchema = false
)
public abstract class BaseDatosLocal extends RoomDatabase {

    // volatile: garantiza que todos los hilos vean el valor más reciente de
    // INSTANCIA, evitando que un hilo lea una referencia "a medio construir".
    private static volatile BaseDatosLocal INSTANCIA;

    /** Acceso al DAO de productos (caché offline del catálogo). */
    public abstract DaoProducto daoProducto();
    /** Acceso al DAO del carrito local (modo sin conexión). */
    public abstract DaoCarrito  daoCarrito();

    /**
     * Devuelve la instancia única de la base de datos, creándola si aún no existe.
     *
     * Implementa el patrón Singleton con "doble comprobación" (double-checked
     * locking): se comprueba el valor antes y después del bloque
     * {@code synchronized} para evitar el coste de sincronizar en cada llamada
     * una vez que la instancia ya está creada.
     *
     * @param contexto contexto desde el que se solicita la BD; se usa
     *                  {@code getApplicationContext()} para no retener una
     *                  referencia a una Activity y evitar fugas de memoria.
     * @return la instancia compartida de {@link BaseDatosLocal}.
     */
    public static BaseDatosLocal obtenerInstancia(Context contexto) {
        if (INSTANCIA == null) {
            synchronized (BaseDatosLocal.class) {
                if (INSTANCIA == null) {
                    INSTANCIA = Room.databaseBuilder(
                        contexto.getApplicationContext(),
                        BaseDatosLocal.class,
                        "galiciawear.db"
                    ).build();
                }
            }
        }
        return INSTANCIA;
    }
}
