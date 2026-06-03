package gal.galiciawear.paneladmin.configuracion;

import java.util.prefs.Preferences;

/**
 * Gestiona la sesión del administrador: persiste los tokens JWT y los datos básicos del usuario
 * usando {@link Preferences} (almacenamiento de claves del usuario del SO), NO una base de datos
 * local. Así la sesión sobrevive entre arranques sin introducir una BBDD embebida.
 */
public class GestorSesion {

    private static final String NODO = "gal/galiciawear/paneladmin";
    private static final String CLAVE_ACCESO = "tokenAcceso";
    private static final String CLAVE_REFRESCO = "tokenRefresco";
    private static final String CLAVE_ID = "usuarioId";
    private static final String CLAVE_CORREO = "correo";
    private static final String CLAVE_ROL = "rol";

    private final Preferences preferencias;

    public GestorSesion() {
        this(Preferences.userRoot().node(NODO));
    }

    /** Constructor para tests: permite inyectar un nodo de preferencias aislado. */
    public GestorSesion(Preferences preferencias) {
        this.preferencias = preferencias;
    }

    public void guardarSesion(String tokenAcceso, String tokenRefresco,
                              String usuarioId, String correo, String rol) {
        preferencias.put(CLAVE_ACCESO, tokenAcceso);
        preferencias.put(CLAVE_REFRESCO, tokenRefresco);
        preferencias.put(CLAVE_ID, usuarioId == null ? "" : usuarioId);
        preferencias.put(CLAVE_CORREO, correo == null ? "" : correo);
        preferencias.put(CLAVE_ROL, rol == null ? "" : rol);
    }

    /** Actualiza solo la pareja de tokens (tras un refresco). */
    public void actualizarTokens(String tokenAcceso, String tokenRefresco) {
        preferencias.put(CLAVE_ACCESO, tokenAcceso);
        preferencias.put(CLAVE_REFRESCO, tokenRefresco);
    }

    public String getTokenAcceso() {
        return vacioANull(preferencias.get(CLAVE_ACCESO, ""));
    }

    public String getTokenRefresco() {
        return vacioANull(preferencias.get(CLAVE_REFRESCO, ""));
    }

    public String getRol() {
        return vacioANull(preferencias.get(CLAVE_ROL, ""));
    }

    public String getCorreo() {
        return vacioANull(preferencias.get(CLAVE_CORREO, ""));
    }

    public boolean hayRefresco() {
        return getTokenRefresco() != null;
    }

    public boolean estaAutenticado() {
        return getTokenAcceso() != null;
    }

    public boolean esAdmin() {
        return "ADMIN".equals(getRol());
    }

    public void limpiar() {
        preferencias.remove(CLAVE_ACCESO);
        preferencias.remove(CLAVE_REFRESCO);
        preferencias.remove(CLAVE_ID);
        preferencias.remove(CLAVE_CORREO);
        preferencias.remove(CLAVE_ROL);
    }

    private static String vacioANull(String valor) {
        return (valor == null || valor.isEmpty()) ? null : valor;
    }
}
