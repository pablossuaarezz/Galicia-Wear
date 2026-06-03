package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.LogActividad;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Visor de logs de auditoría (GET /admin/logs — lee MongoDB a través de la API). */
public class ServicioLogs extends ServicioBase {

    public ServicioLogs(ClienteHttp http) {
        super(http);
    }

    public List<LogActividad> listar(String accion, String recurso) {
        StringBuilder ruta = new StringBuilder("/admin/logs?limite=100");
        if (accion != null && !accion.isBlank()) {
            ruta.append("&accion=").append(URLEncoder.encode(accion, StandardCharsets.UTF_8));
        }
        if (recurso != null && !recurso.isBlank()) {
            ruta.append("&recurso=").append(URLEncoder.encode(recurso, StandardCharsets.UTF_8));
        }
        return listaDesde(http.get(ruta.toString()), "logs", LogActividad.class);
    }
}
