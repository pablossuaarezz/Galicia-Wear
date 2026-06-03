package gal.galiciawear.paneladmin.util;

import javafx.concurrent.Task;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * Ejecuta trabajo (típicamente llamadas HTTP) fuera del hilo de la interfaz usando
 * {@link Task} de JavaFX. Los callbacks de éxito/error se invocan en el hilo de la UI, por lo que
 * es seguro actualizar componentes desde ellos.
 *
 * <p>JUSTIFICACIÓN (rúbrica DAM "hilos"): nunca se bloquea el JavaFX Application Thread con E/S de
 * red; de lo contrario la ventana se congelaría durante cada petición.
 */
public final class EjecutorTareas {

    // Pool de hilos demonio: no impiden que la JVM termine al cerrar la app.
    private static final ExecutorService POOL = Executors.newCachedThreadPool(tarea -> {
        Thread hilo = new Thread(tarea, "tarea-galiciawear");
        hilo.setDaemon(true);
        return hilo;
    });

    private EjecutorTareas() {
    }

    public static <T> void ejecutar(Callable<T> trabajo, Consumer<T> alExito, Consumer<Throwable> alError) {
        Task<T> tarea = new Task<>() {
            @Override
            protected T call() throws Exception {
                return trabajo.call();
            }
        };
        tarea.setOnSucceeded(evento -> alExito.accept(tarea.getValue()));
        tarea.setOnFailed(evento -> alError.accept(tarea.getException()));
        POOL.submit(tarea);
    }

    public static void apagar() {
        POOL.shutdownNow();
    }
}
