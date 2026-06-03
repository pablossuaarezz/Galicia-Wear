package gal.galiciawear.paneladmin.configuracion;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GestorSesionTest {

    private final Preferences nodo =
            Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
    private final GestorSesion sesion = new GestorSesion(nodo);

    @AfterEach
    void limpiar() throws Exception {
        nodo.removeNode();
    }

    @Test
    void sinSesionNoEstaAutenticado() {
        assertFalse(sesion.estaAutenticado());
        assertNull(sesion.getTokenAcceso());
    }

    @Test
    void guardaYRecuperaLaSesion() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");

        assertTrue(sesion.estaAutenticado());
        assertTrue(sesion.esAdmin());
        assertEquals("acc", sesion.getTokenAcceso());
        assertEquals("ref", sesion.getTokenRefresco());
        assertEquals("admin@gw.gal", sesion.getCorreo());
    }

    @Test
    void actualizarTokensSoloCambiaLosTokens() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");
        sesion.actualizarTokens("acc2", "ref2");

        assertEquals("acc2", sesion.getTokenAcceso());
        assertEquals("ref2", sesion.getTokenRefresco());
        assertEquals("admin@gw.gal", sesion.getCorreo());
    }

    @Test
    void limpiarBorraLaSesion() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");
        sesion.limpiar();

        assertFalse(sesion.estaAutenticado());
        assertNull(sesion.getTokenRefresco());
    }
}
