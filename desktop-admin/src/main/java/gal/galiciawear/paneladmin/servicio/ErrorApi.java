package gal.galiciawear.paneladmin.servicio;

/** Excepción que representa un error devuelto por la API o un fallo de red. */
public class ErrorApi extends RuntimeException {

    private final int codigo;

    public ErrorApi(int codigo, String mensaje) {
        super(mensaje);
        this.codigo = codigo;
    }

    public ErrorApi(String mensaje, Throwable causa) {
        super(mensaje, causa);
        this.codigo = 0;
    }

    /** Código HTTP (0 si fue un error de red/cliente). */
    public int getCodigo() {
        return codigo;
    }

    public boolean esNoAutorizado() {
        return codigo == 401;
    }
}
