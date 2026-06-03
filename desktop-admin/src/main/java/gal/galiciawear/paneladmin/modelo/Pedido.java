package gal.galiciawear.paneladmin.modelo;

/** Pedido tal y como lo devuelve GET /admin/pedidos. */
public record Pedido(
        String id,
        String numeroPedido,
        String clienteId,
        String estado,
        String subtotal,
        String costeEnvio,
        String total,
        String metodoPago,
        String fechaCreacion) {
}
