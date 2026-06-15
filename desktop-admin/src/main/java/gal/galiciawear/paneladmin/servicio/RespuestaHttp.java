package gal.galiciawear.paneladmin.servicio;

/** Respuesta HTTP cruda: código de estado + cuerpo como texto. */
public record RespuestaHttp(int codigo, String cuerpo) {

    /** Indica si el código de estado está en el rango 2xx (petición correcta). */
    public boolean exito() {
        return codigo >= 200 && codigo < 300;
    }
}
