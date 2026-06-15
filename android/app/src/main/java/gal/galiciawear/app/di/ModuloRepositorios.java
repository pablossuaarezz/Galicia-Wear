package gal.galiciawear.app.di;

/*
 * Módulo Hilt reservado como punto de extensión para los repositorios.
 * Actualmente vacío porque todos los repositorios usan @Inject en su
 * constructor y Hilt los resuelve automáticamente sin necesidad de
 * @Provides/@Binds explícitos en este módulo.
 */

import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

/**
 * Módulo Hilt para repositorios.
 *
 * JUSTIFICACIÓN: Los repositorios tienen constructores @Inject, por lo que
 * Hilt los instancia automáticamente sin necesitar @Provides explícitos.
 * Este módulo existe como punto de extensión para bindings futuros
 * (p.ej. interfaces de repositorio → implementación concreta).
 */
@Module
@InstallIn(SingletonComponent.class)
public class ModuloRepositorios {
    // Los repositorios concretos usan @Inject en su constructor,
    // así que Hilt los resuelve sin @Provides adicionales.
    // Si en el futuro se introduce una interfaz IRepositorioProductos,
    // aquí se añadiría el @Binds correspondiente.
}
