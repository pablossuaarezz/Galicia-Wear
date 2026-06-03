package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.Producto;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Gestión de productos: listado (incl. inactivos), moderación y retirada. */
public class ServicioProductos extends ServicioBase {

    public ServicioProductos(ClienteHttp http) {
        super(http);
    }

    /** Lista productos. {@code activo} null = todos; true = activos; false = inactivos/retirados. */
    public List<Producto> listar(Boolean activo, String busqueda) {
        StringBuilder ruta = new StringBuilder("/admin/productos?limite=100");
        if (activo != null) {
            ruta.append("&activo=").append(activo);
        }
        if (busqueda != null && !busqueda.isBlank()) {
            ruta.append("&busqueda=").append(URLEncoder.encode(busqueda, StandardCharsets.UTF_8));
        }
        return listaDesde(http.get(ruta.toString()), "productos", Producto.class);
    }

    /** Activa o desactiva un producto (PATCH /admin/productos/:id). */
    public void cambiarActivo(String id, boolean activo) {
        RespuestaHttp respuesta = http.patch("/admin/productos/" + id, "{\"activo\":" + activo + "}");
        exigirExito(respuesta);
    }

    /** Retira un producto del catálogo (DELETE /admin/productos/:id — soft-delete). */
    public void retirar(String id) {
        RespuestaHttp respuesta = http.eliminar("/admin/productos/" + id);
        exigirExito(respuesta);
    }
}
