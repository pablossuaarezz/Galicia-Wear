package gal.galiciawear.paneladmin.modelo;

/** Producto tal y como lo devuelve GET /admin/productos (selección "resumen"). */
public record Producto(
        String id,
        String disenadorId,
        String nombre,
        String slug,
        String precioBase,
        int kmOrigen,
        String materialPrincipal,
        boolean activo,
        String fechaCreacion,
        DisenadorMini disenador) {

    /** Submarca del producto (anidada). */
    public record DisenadorMini(String nombreMarca, String ciudad, String urlLogo) {
    }

    public String nombreMarca() {
        return disenador == null ? "" : disenador.nombreMarca();
    }
}
