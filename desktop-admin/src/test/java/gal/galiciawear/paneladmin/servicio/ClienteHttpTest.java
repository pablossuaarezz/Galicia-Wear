package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClienteHttpTest {

    private MockWebServer servidor;
    private Preferences nodo;
    private GestorSesion sesion;
    private ClienteHttp cliente;

    @BeforeEach
    void preparar() throws Exception {
        servidor = new MockWebServer();
        servidor.start();
        nodo = Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
        sesion = new GestorSesion(nodo);
        cliente = new ClienteHttp(servidor.url("/").toString(), sesion);
    }

    @AfterEach
    void cerrar() throws Exception {
        servidor.shutdown();
        nodo.removeNode();
    }

    @Test
    void anadeCabeceraAutorizacionConElTokenVigente() throws Exception {
        sesion.guardarSesion("token-123", "ref", "u1", "a@gw.gal", "ADMIN");
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("{}"));

        cliente.get("/admin/estadisticas");

        RecordedRequest peticion = servidor.takeRequest();
        assertEquals("Bearer token-123", peticion.getHeader("Authorization"));
    }

    @Test
    void ante401RefrescaElTokenYReintenta() throws Exception {
        sesion.guardarSesion("viejo", "refViejo", "u1", "a@gw.gal", "ADMIN");
        // 1) la petición original devuelve 401
        servidor.enqueue(new MockResponse().setResponseCode(401).setBody("{\"error\":\"expirado\"}"));
        // 2) el refresco devuelve una pareja nueva
        servidor.enqueue(new MockResponse().setResponseCode(200)
                .setBody("{\"tokenAcceso\":\"nuevo\",\"tokenRefresco\":\"refNuevo\"}"));
        // 3) el reintento ya funciona
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("{\"ok\":true}"));

        RespuestaHttp respuesta = cliente.get("/admin/estadisticas");

        assertTrue(respuesta.exito());
        assertEquals(3, servidor.getRequestCount());

        servidor.takeRequest(); // original
        RecordedRequest refresco = servidor.takeRequest();
        assertEquals("/auth/refresh", refresco.getPath());

        RecordedRequest reintento = servidor.takeRequest();
        assertEquals("Bearer nuevo", reintento.getHeader("Authorization"));
        assertEquals("nuevo", sesion.getTokenAcceso());
        assertEquals("refNuevo", sesion.getTokenRefresco());
    }
}
