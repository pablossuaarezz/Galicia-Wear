package gal.galiciawear.paneladmin.modelo;

import java.util.List;

/** Resumen devuelto por POST /admin/importar/productos (bajo la clave "resultado"). */
public record ResultadoImportacion(int creados, int actualizados, List<ErrorImportacion> errores) {

    public List<ErrorImportacion> errores() {
        return errores == null ? List.of() : errores;
    }

    public record ErrorImportacion(int indice, String nombre, String motivo) {
    }
}
