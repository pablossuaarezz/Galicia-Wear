package gal.galiciawear.app.utilidades;

/**
 * Envuelve el estado de una operación asíncrona para que la UI pueda
 * reaccionar a CARGANDO / EXITO / ERROR con un único observer de LiveData.
 *
 * Patrón Resource de la Guía de Arquitectura de Android adaptado al dominio
 * GaliciaWear. Usar genérico <T> permite reutilizarlo para cualquier tipo
 * de dato (productos, pedidos, usuario…) sin duplicar lógica en la UI.
 */
public class RecursoUi<T> {

    public enum Estado { CARGANDO, EXITO, ERROR }

    public final Estado estado;
    public final T datos;
    public final String mensaje;

    private RecursoUi(Estado estado, T datos, String mensaje) {
        this.estado  = estado;
        this.datos   = datos;
        this.mensaje = mensaje;
    }

    public static <T> RecursoUi<T> cargando() {
        return new RecursoUi<>(Estado.CARGANDO, null, null);
    }

    public static <T> RecursoUi<T> exito(T datos) {
        return new RecursoUi<>(Estado.EXITO, datos, null);
    }

    public static <T> RecursoUi<T> error(String mensaje) {
        return new RecursoUi<>(Estado.ERROR, null, mensaje);
    }

    public boolean estaCargando() { return estado == Estado.CARGANDO; }
    public boolean esExito()      { return estado == Estado.EXITO; }
    public boolean esError()      { return estado == Estado.ERROR; }
}
