package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.Disenador;

import java.util.List;

/** Gestión de diseñadores: listado (incl. pendientes) y validación. */
public class ServicioDisenadores extends ServicioBase {

    public ServicioDisenadores(ClienteHttp http) {
        super(http);
    }

    /**
     * Lista diseñadores. {@code validado} null = todos; true = solo validados; false = solo
     * pendientes.
     */
    public List<Disenador> listar(Boolean validado) {
        String ruta = "/admin/disenadores?limite=100";
        if (validado != null) {
            ruta += "&validado=" + validado;
        }
        return listaDesde(http.get(ruta), "disenadores", Disenador.class);
    }

    /** Aprueba o rechaza un diseñador (PATCH /disenadores/:id/validar). */
    public void validar(String usuarioId, boolean aprobar) {
        RespuestaHttp respuesta = http.patch("/disenadores/" + usuarioId + "/validar",
                "{\"aprobar\":" + aprobar + "}");
        exigirExito(respuesta);
    }
}
