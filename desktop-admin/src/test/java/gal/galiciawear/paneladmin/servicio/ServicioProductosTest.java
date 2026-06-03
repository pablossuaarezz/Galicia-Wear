package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import gal.galiciawear.paneladmin.modelo.Producto;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServicioProductosTest {

    private MockWebServer servidor;
    private Preferences nodo;
    private ServicioProductos servicio;

    @BeforeEach
    void preparar() throws Exception {
        servidor = new MockWebServer();
        servidor.start();
        nodo = Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
        servicio = new ServicioProductos(new ClienteHttp(servidor.url("/").toString(), new GestorSesion(nodo)));
    }

    @AfterEach
    void cerrar() throws Exception {
        servidor.shutdown();
        nodo.removeNode();
    }

    @Test
    void listarDevuelveLosProductosDelArray() {
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("""
                {"productos":[
                  {"id":"p1","nombre":"Camiseta Lino","precioBase":"29.90","activo":true,
                   "materialPrincipal":"LINO","disenador":{"nombreMarca":"Liñares"}},
                  {"id":"p2","nombre":"Jersey","precioBase":"49.00","activo":false,
                   "materialPrincipal":"LANA_RECICLADA","disenador":{"nombreMarca":"Liñares"}}
                ],"total":2}"""));

        List<Producto> productos = servicio.listar(null, null);

        assertEquals(2, productos.size());
        assertEquals("Camiseta Lino", productos.get(0).nombre());
        assertEquals("Liñares", productos.get(0).nombreMarca());
        assertTrue(productos.get(0).activo());
        assertFalse(productos.get(1).activo());
    }

    @Test
    void cambiarActivoEnviaPatchConElCuerpoCorrecto() throws Exception {
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("{\"producto\":{}}"));

        servicio.cambiarActivo("p1", false);

        RecordedRequest peticion = servidor.takeRequest();
        assertEquals("PATCH", peticion.getMethod());
        assertEquals("/admin/productos/p1", peticion.getPath());
        assertTrue(peticion.getBody().readUtf8().contains("\"activo\":false"));
    }

    @Test
    void retirarEnviaDelete() throws Exception {
        servidor.enqueue(new MockResponse().setResponseCode(204));

        servicio.retirar("p1");

        RecordedRequest peticion = servidor.takeRequest();
        assertEquals("DELETE", peticion.getMethod());
        assertEquals("/admin/productos/p1", peticion.getPath());
    }
}
