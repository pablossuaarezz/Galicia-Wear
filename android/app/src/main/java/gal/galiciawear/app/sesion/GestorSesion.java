package gal.galiciawear.app.sesion;

import android.content.Context;
import android.content.SharedPreferences;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.utilidades.Constantes;
import dagger.hilt.android.qualifiers.ApplicationContext;

/**
 * Gestiona la sesión del usuario mediante SharedPreferences.
 * Es un Singleton (una sola instancia durante toda la vida de la app)
 * para garantizar que todos los componentes lean el mismo estado de sesión.
 *
 * JUSTIFICACIÓN: Se usa MODE_PRIVATE para que solo esta app pueda leer
 * los tokens. En producción sería preferible EncryptedSharedPreferences,
 * pero para el TFG MODE_PRIVATE es suficiente y evita la dependencia alpha.
 */
@Singleton
public class GestorSesion {

    private final SharedPreferences prefs;

    @Inject
    public GestorSesion(@ApplicationContext Context contexto) {
        this.prefs = contexto.getSharedPreferences(
            Constantes.PREFS_SESION,
            Context.MODE_PRIVATE
        );
    }

    // ── Tokens ───────────────────────────────────────────────────────────────

    public void guardarTokens(String tokenAcceso, String tokenRefresh) {
        prefs.edit()
            .putString(Constantes.CLAVE_TOKEN_ACCESO,  tokenAcceso)
            .putString(Constantes.CLAVE_TOKEN_REFRESH, tokenRefresh)
            .apply();
    }

    public String obtenerTokenAcceso() {
        return prefs.getString(Constantes.CLAVE_TOKEN_ACCESO, null);
    }

    public String obtenerTokenRefresh() {
        return prefs.getString(Constantes.CLAVE_TOKEN_REFRESH, null);
    }

    public boolean hayTokenAcceso() {
        return obtenerTokenAcceso() != null;
    }

    public boolean hayTokenRefresh() {
        return obtenerTokenRefresh() != null;
    }

    // ── Datos del usuario ────────────────────────────────────────────────────

    public void guardarDatosUsuario(String id, String rol, String nombre) {
        prefs.edit()
            .putString(Constantes.CLAVE_USUARIO_ID,     id)
            .putString(Constantes.CLAVE_USUARIO_ROL,    rol)
            .putString(Constantes.CLAVE_USUARIO_NOMBRE, nombre)
            .apply();
    }

    public String obtenerUsuarioId()     { return prefs.getString(Constantes.CLAVE_USUARIO_ID, ""); }
    public String obtenerUsuarioRol()    { return prefs.getString(Constantes.CLAVE_USUARIO_ROL, ""); }
    public String obtenerUsuarioNombre() { return prefs.getString(Constantes.CLAVE_USUARIO_NOMBRE, ""); }

    // ── Onboarding ───────────────────────────────────────────────────────────

    public boolean onboardingYaVisto() {
        return prefs.getBoolean(Constantes.CLAVE_ONBOARDING_VISTO, false);
    }

    public void marcarOnboardingVisto() {
        prefs.edit().putBoolean(Constantes.CLAVE_ONBOARDING_VISTO, true).apply();
    }

    // ── Cierre de sesión ─────────────────────────────────────────────────────

    public void cerrarSesion() {
        // Se conserva el flag de onboarding para no repetirlo tras re-login
        boolean onboardingVisto = onboardingYaVisto();
        prefs.edit().clear().apply();
        marcarOnboardingVisto();
        if (!onboardingVisto) {
            prefs.edit().remove(Constantes.CLAVE_ONBOARDING_VISTO).apply();
        }
    }
}
