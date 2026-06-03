package gal.galiciawear.paneladmin.controlador;

/** Contrato opcional para que una vista libere recursos al ser sustituida (p. ej. el dashboard). */
public interface ControladorVista {
    default void alSalir() {
    }
}
