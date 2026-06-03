package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.Pedido;

import java.util.List;

/** Gestión de pedidos: listado global y cancelación. */
public class ServicioPedidos extends ServicioBase {

    public ServicioPedidos(ClienteHttp http) {
        super(http);
    }

    /** Lista todos los pedidos. {@code estado} null = todos. */
    public List<Pedido> listar(String estado) {
        String ruta = "/admin/pedidos?limite=100";
        if (estado != null && !estado.isBlank()) {
            ruta += "&estado=" + estado;
        }
        return listaDesde(http.get(ruta), "pedidos", Pedido.class);
    }

    /** Cancela un pedido (PATCH /pedidos/:id/cancelar — el backend ya admite rol ADMIN). */
    public void cancelar(String id) {
        RespuestaHttp respuesta = http.patch("/pedidos/" + id + "/cancelar", "{}");
        exigirExito(respuesta);
    }
}
