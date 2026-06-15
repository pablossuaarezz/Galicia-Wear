package gal.galiciawear.paneladmin.configuracion;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.prefs.Preferences;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas unitarias del GestorSesion (persistencia de la sesión en Preferences).
 * Cada test usa un nodo de Preferences aislado (UUID) que se borra al terminar.
 */
class GestorSesionTest {

    // Nodo de preferencias único por instancia para no interferir con la sesión real ni entre tests.
    private final Preferences nodo =
            Preferences.userRoot().node("gal/galiciawear/paneladmin-test-" + UUID.randomUUID());
    private final GestorSesion sesion = new GestorSesion(nodo);

    /** Borra el nodo de preferencias tras cada test para dejar el entorno limpio. */
    @AfterEach
    void limpiar() throws Exception {
        nodo.removeNode();
    }

    /** Sin haber guardado nada, no debe haber sesión ni token de acceso. */
    @Test
    void sinSesionNoEstaAutenticado() {
        assertFalse(sesion.estaAutenticado());
        assertNull(sesion.getTokenAcceso());
    }

    /** Tras guardar la sesión, todos los datos (tokens, correo, rol) deben recuperarse. */
    @Test
    void guardaYRecuperaLaSesion() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");

        assertTrue(sesion.estaAutenticado());
        assertTrue(sesion.esAdmin());
        assertEquals("acc", sesion.getTokenAcceso());
        assertEquals("ref", sesion.getTokenRefresco());
        assertEquals("admin@gw.gal", sesion.getCorreo());
    }

    /** Renovar los tokens (refresh) no debe alterar el resto de datos de la sesión. */
    @Test
    void actualizarTokensSoloCambiaLosTokens() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");
        sesion.actualizarTokens("acc2", "ref2");

        assertEquals("acc2", sesion.getTokenAcceso());
        assertEquals("ref2", sesion.getTokenRefresco());
        assertEquals("admin@gw.gal", sesion.getCorreo());
    }

    /** Limpiar la sesión debe dejar el estado como si nunca se hubiera iniciado. */
    @Test
    void limpiarBorraLaSesion() {
        sesion.guardarSesion("acc", "ref", "u1", "admin@gw.gal", "ADMIN");
        sesion.limpiar();

        assertFalse(sesion.estaAutenticado());
        assertNull(sesion.getTokenRefresco());
    }
}
