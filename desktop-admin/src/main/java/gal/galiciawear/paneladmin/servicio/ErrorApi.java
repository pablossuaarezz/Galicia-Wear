package gal.galiciawear.paneladmin.servicio;

/** Excepción que representa un error devuelto por la API o un fallo de red. */
public class ErrorApi extends RuntimeException {

    private final int codigo;

    /** Error con código HTTP devuelto por el backend (p. ej. 401, 404, 500). */
    public ErrorApi(int codigo, String mensaje) {
        super(mensaje);
        this.codigo = codigo;
    }

    /** Error de red/cliente (sin respuesta del servidor); el código queda en 0. */
    public ErrorApi(String mensaje, Throwable causa) {
        super(mensaje, causa);
        this.codigo = 0;
    }

    /** Código HTTP (0 si fue un error de red/cliente). */
    public int getCodigo() {
        return codigo;
    }

    /** Indica si el error es un 401 (sesión caducada o credenciales inválidas). */
    public boolean esNoAutorizado() {
        return codigo == 401;
    }
}
