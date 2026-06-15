package gal.galiciawear.paneladmin.servicio;

import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import gal.galiciawear.paneladmin.modelo.UsuarioBasico;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas de integración de ServicioAutenticacion usando un MockWebServer que simula la API,
 * verificando el control de acceso por rol (solo ADMIN) y el manejo de errores 401/403.
 */
class ServicioAutenticacionTest {

    private MockWebServer servidor;
    private Preferences nodo;
    private GestorSesion sesion;
    private ServicioAutenticacion servicio;

    /** Arranca el servidor simulado y crea un servicio apuntando a su URL con una sesión aislada. */
    @BeforeEach
    void preparar() throws Exception {
        servidor = new MockWebServer();
        servidor.start();
        nodo = Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
        sesion = new GestorSesion(nodo);
        servicio = new ServicioAutenticacion(new ClienteHttp(servidor.url("/").toString(), sesion), sesion);
    }

    /** Detiene el servidor simulado y borra el nodo de preferencias tras cada test. */
    @AfterEach
    void cerrar() throws Exception {
        servidor.shutdown();
        nodo.removeNode();
    }

    /** Un login válido con rol ADMIN debe persistir la sesión y sus tokens. */
    @Test
    void loginAdminGuardaLaSesion() {
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("""
                {"tokenAcceso":"acc","tokenRefresco":"ref","expiraEn":"15m",
                 "usuario":{"id":"u1","correo":"admin@gw.gal","rol":"ADMIN"}}"""));

        UsuarioBasico usuario = servicio.iniciarSesion("admin@gw.gal", "Secreta123");

        assertEquals("ADMIN", usuario.rol());
        assertTrue(sesion.estaAutenticado());
        assertEquals("acc", sesion.getTokenAcceso());
    }

    /** Credenciales válidas pero de rol no-ADMIN deben rechazarse con 403 y sin guardar sesión. */
    @Test
    void loginDeNoAdminEsRechazadoYNoGuardaSesion() {
        servidor.enqueue(new MockResponse().setResponseCode(200).setBody("""
                {"tokenAcceso":"acc","tokenRefresco":"ref","expiraEn":"15m",
                 "usuario":{"id":"u2","correo":"ana@gw.gal","rol":"CLIENTE"}}"""));

        ErrorApi error = assertThrows(ErrorApi.class,
                () -> servicio.iniciarSesion("ana@gw.gal", "Secreta123"));

        assertEquals(403, error.getCodigo());
        assertFalse(sesion.estaAutenticado());
    }

    /** Un 401 del servidor debe traducirse en un ErrorApi marcado como "no autorizado". */
    @Test
    void credencialesInvalidasLanzan401() {
        servidor.enqueue(new MockResponse().setResponseCode(401).setBody("{\"error\":\"Credenciales inválidas\"}"));

        ErrorApi error = assertThrows(ErrorApi.class,
                () -> servicio.iniciarSesion("admin@gw.gal", "mal"));

        assertTrue(error.esNoAutorizado());
    }
}
