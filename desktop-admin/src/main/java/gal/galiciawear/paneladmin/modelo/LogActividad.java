package gal.galiciawear.paneladmin.modelo;

/** Entrada del log de auditoría (MongoDB) que devuelve GET /admin/logs. */
public record LogActividad(
        String usuarioId,
        String accion,
        String recurso,
        String recursoId,
        String ipOrigen,
        String fechaCreacion) {
}
