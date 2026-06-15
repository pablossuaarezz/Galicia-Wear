package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.Estadisticas;

/** KPIs del dashboard (GET /admin/estadisticas). */
public class ServicioEstadisticas extends ServicioBase {

    public ServicioEstadisticas(ClienteHttp http) {
        super(http);
    }

    /** Recupera los KPIs del dashboard, desenvolviendo la clave "estadisticas" de la respuesta. */
    public Estadisticas obtener() {
        RespuestaHttp respuesta = http.get("/admin/estadisticas");
        exigirExito(respuesta);
        return Json.convertir(Json.leerArbol(respuesta.cuerpo()).path("estadisticas"), Estadisticas.class);
    }
}
