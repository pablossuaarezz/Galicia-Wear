package gal.galiciawear.paneladmin.nucleo;

import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import gal.galiciawear.paneladmin.servicio.ClienteHttp;
import gal.galiciawear.paneladmin.servicio.ServicioAutenticacion;
import gal.galiciawear.paneladmin.servicio.ServicioDisenadores;
import gal.galiciawear.paneladmin.servicio.ServicioEstadisticas;
import gal.galiciawear.paneladmin.servicio.ServicioImportExport;
import gal.galiciawear.paneladmin.servicio.ServicioLogs;
import gal.galiciawear.paneladmin.servicio.ServicioPedidos;
import gal.galiciawear.paneladmin.servicio.ServicioProductos;

/**
 * Contenedor de dependencias compartidas (sesión, cliente HTTP y servicios). Se inyecta en los
 * controladores mediante la {@code controllerFactory} del FXMLLoader. Sustituye a un framework de
 * DI completo: para una app de escritorio pequeña, un contenedor manual es suficiente y explícito.
 */
public class Contexto {

    public final GestorSesion sesion;
    public final ClienteHttp http;

    public final ServicioAutenticacion autenticacion;
    public final ServicioEstadisticas estadisticas;
    public final ServicioDisenadores disenadores;
    public final ServicioProductos productos;
    public final ServicioPedidos pedidos;
    public final ServicioLogs logs;
    public final ServicioImportExport importExport;

    /** La navegación se asigna tras crear el contexto (necesita el Stage). */
    public Navegacion navegacion;

    public Contexto(String urlBaseApi) {
        this(urlBaseApi, new GestorSesion());
    }

    /** Constructor para tests: permite inyectar una sesión aislada. */
    public Contexto(String urlBaseApi, GestorSesion sesion) {
        this.sesion = sesion;
        this.http = new ClienteHttp(urlBaseApi, sesion);
        this.autenticacion = new ServicioAutenticacion(http, sesion);
        this.estadisticas = new ServicioEstadisticas(http);
        this.disenadores = new ServicioDisenadores(http);
        this.productos = new ServicioProductos(http);
        this.pedidos = new ServicioPedidos(http);
        this.logs = new ServicioLogs(http);
        this.importExport = new ServicioImportExport(http);
    }
}
