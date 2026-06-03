package gal.galiciawear.paneladmin.modelo;

import java.util.Map;

/** KPIs del dashboard que devuelve GET /admin/estadisticas (bajo la clave "estadisticas"). */
public record Estadisticas(
        int totalUsuarios,
        int totalClientes,
        int totalDisenadores,
        int totalDisenadoresPendientes,
        int totalProductos,
        int totalPedidosMes,
        String ingresosMes,
        Map<String, Integer> pedidosPorEstado) {

    public Map<String, Integer> pedidosPorEstado() {
        return pedidosPorEstado == null ? Map.of() : pedidosPorEstado;
    }
}
