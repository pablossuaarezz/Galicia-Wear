package gal.galiciawear.paneladmin.modelo;

/** Diseñador tal y como lo devuelve GET /admin/disenadores. */
public record Disenador(
        String usuarioId,
        String nombreMarca,
        String biografia,
        String ciudad,
        boolean validado,
        String fechaValidacion,
        String urlLogo,
        String urlWeb,
        String fechaCreacion) {
}
