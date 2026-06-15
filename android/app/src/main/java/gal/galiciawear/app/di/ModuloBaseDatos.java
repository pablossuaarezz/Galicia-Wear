package gal.galiciawear.app.di;

import android.content.Context;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;
import gal.galiciawear.app.datos.local.BaseDatosLocal;
import gal.galiciawear.app.datos.local.dao.DaoCarrito;
import gal.galiciawear.app.datos.local.dao.DaoProducto;

/**
 * Módulo Hilt que provee Room (BBDD local para caché offline).
 *
 * JUSTIFICACIÓN: La base de datos Room es una dependencia pesada que
 * no debe recrearse. El Singleton garantiza que todos los DAOs apuntan
 * al mismo fichero SQLite en disco, evitando inconsistencias.
 */
@Module
@InstallIn(SingletonComponent.class)
public class ModuloBaseDatos {

    /**
     * Provee la instancia única de {@link BaseDatosLocal} (Room).
     *
     * @Singleton: Hilt crea esta instancia una sola vez y la reutiliza en
     * todas las inyecciones, delegando en el patrón Singleton ya
     * implementado dentro de {@code BaseDatosLocal.obtenerInstancia}.
     *
     * @param contexto contexto de aplicación inyectado por Hilt mediante
     *                  {@code @ApplicationContext} (evita fugas de memoria
     *                  al no depender de una Activity concreta).
     * @return la instancia compartida de la base de datos Room.
     */
    @Provides
    @Singleton
    public BaseDatosLocal proveerBaseDatos(@ApplicationContext Context contexto) {
        return BaseDatosLocal.obtenerInstancia(contexto);
    }

    /**
     * Provee el DAO de productos a partir de la base de datos ya creada.
     * No se marca como @Singleton porque el propio DAO es ligero (una
     * interfaz generada por Room) y depende de un Singleton (la BD).
     *
     * @param bd instancia de la base de datos Room, inyectada por Hilt.
     * @return el DAO de productos.
     */
    @Provides
    public DaoProducto proveerDaoProducto(BaseDatosLocal bd) {
        return bd.daoProducto();
    }

    /**
     * Provee el DAO del carrito local a partir de la base de datos ya creada.
     *
     * @param bd instancia de la base de datos Room, inyectada por Hilt.
     * @return el DAO del carrito local.
     */
    @Provides
    public DaoCarrito proveerDaoCarrito(BaseDatosLocal bd) {
        return bd.daoCarrito();
    }
}
