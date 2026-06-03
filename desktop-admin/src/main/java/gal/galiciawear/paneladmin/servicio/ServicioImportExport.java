package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.modelo.ResultadoImportacion;

/** Exportación e importación del catálogo en XML/JSON (endpoints /admin/exportar y /admin/importar). */
public class ServicioImportExport extends ServicioBase {

    public ServicioImportExport(ClienteHttp http) {
        super(http);
    }

    /** Descarga el catálogo en el formato indicado ("json" o "xml") y devuelve su contenido. */
    public String exportar(String formato) {
        RespuestaHttp respuesta = http.get("/admin/exportar/productos." + formato);
        exigirExito(respuesta);
        return respuesta.cuerpo();
    }

    /** Importa productos desde un contenido JSON o XML. */
    public ResultadoImportacion importar(String formato, String datos) {
        String cuerpo = Json.escribir(new Sobre(formato, datos));
        RespuestaHttp respuesta = http.post("/admin/importar/productos", cuerpo);
        exigirExito(respuesta);
        return Json.convertir(Json.leerArbol(respuesta.cuerpo()).path("resultado"), ResultadoImportacion.class);
    }

    /** Envelope { formato, datos } que espera el backend. */
    private record Sobre(String formato, String datos) {
    }
}
