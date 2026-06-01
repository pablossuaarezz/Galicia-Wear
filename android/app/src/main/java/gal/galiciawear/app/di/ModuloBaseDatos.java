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

    @Provides
    @Singleton
    public BaseDatosLocal proveerBaseDatos(@ApplicationContext Context contexto) {
        return BaseDatosLocal.obtenerInstancia(contexto);
    }

    @Provides
    public DaoProducto proveerDaoProducto(BaseDatosLocal bd) {
        return bd.daoProducto();
    }

    @Provides
    public DaoCarrito proveerDaoCarrito(BaseDatosLocal bd) {
        return bd.daoCarrito();
    }
}
