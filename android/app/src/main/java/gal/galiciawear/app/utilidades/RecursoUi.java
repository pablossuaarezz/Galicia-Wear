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

    /**
     * Posibles estados de una operación asíncrona representada por
     * {@link RecursoUi}.
     */
    public enum Estado {
        /** La operación está en curso (mostrar indicador de carga). */
        CARGANDO,
        /** La operación terminó correctamente; {@link #datos} contiene el resultado. */
        EXITO,
        /** La operación falló; {@link #mensaje} describe el error. */
        ERROR
    }

    /** Estado actual del recurso. */
    public final Estado estado;
    /** Datos resultantes de la operación (solo válidos en estado {@link Estado#EXITO}). */
    public final T datos;
    /** Mensaje descriptivo del error (solo válido en estado {@link Estado#ERROR}). */
    public final String mensaje;

    /**
     * Constructor privado: las instancias solo se crean mediante las
     * factorías estáticas {@link #cargando()}, {@link #exito(Object)} y
     * {@link #error(String)}, que garantizan combinaciones válidas de campos.
     */
    private RecursoUi(Estado estado, T datos, String mensaje) {
        this.estado  = estado;
        this.datos   = datos;
        this.mensaje = mensaje;
    }

    /**
     * Crea un recurso en estado de carga (sin datos ni mensaje de error).
     *
     * @param <T> tipo de dato que envolverá el recurso una vez completado.
     * @return un {@link RecursoUi} con estado {@link Estado#CARGANDO}.
     */
    public static <T> RecursoUi<T> cargando() {
        return new RecursoUi<>(Estado.CARGANDO, null, null);
    }

    /**
     * Crea un recurso en estado de éxito con los datos obtenidos.
     *
     * @param datos resultado de la operación.
     * @param <T>   tipo de los datos.
     * @return un {@link RecursoUi} con estado {@link Estado#EXITO}.
     */
    public static <T> RecursoUi<T> exito(T datos) {
        return new RecursoUi<>(Estado.EXITO, datos, null);
    }

    /**
     * Crea un recurso en estado de error con el mensaje correspondiente.
     *
     * @param mensaje mensaje descriptivo del error, normalmente ya extraído
     *                 mediante {@link RespuestasApi#extraerMensajeError}.
     * @param <T>     tipo de dato que habría envuelto el recurso en caso de éxito.
     * @return un {@link RecursoUi} con estado {@link Estado#ERROR}.
     */
    public static <T> RecursoUi<T> error(String mensaje) {
        return new RecursoUi<>(Estado.ERROR, null, mensaje);
    }

    /** @return {@code true} si el recurso está en estado de carga. */
    public boolean estaCargando() { return estado == Estado.CARGANDO; }
    /** @return {@code true} si el recurso representa una operación exitosa. */
    public boolean esExito()      { return estado == Estado.EXITO; }
    /** @return {@code true} si el recurso representa un error. */
    public boolean esError()      { return estado == Estado.ERROR; }
}
