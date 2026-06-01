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

    private static volatile BaseDatosLocal INSTANCIA;

    public abstract DaoProducto daoProducto();
    public abstract DaoCarrito  daoCarrito();

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
