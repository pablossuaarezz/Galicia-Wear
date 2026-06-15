package gal.galiciawear.app.sesion;

/*
 * Clase encargada de persistir y consultar el estado de sesión del usuario
 * (tokens JWT de acceso y refresco, datos básicos del usuario autenticado
 * y el flag de onboarding) usando SharedPreferences. Es el punto único de
 * verdad sobre "¿hay un usuario logueado y quién es?" para el resto de la app.
 */

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

    /** Almacén de preferencias privado donde se guardan tokens y datos de sesión. */
    private final SharedPreferences prefs;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param contexto contexto de aplicación (no de Activity) para evitar
     *                  fugas de memoria, proporcionado vía {@code @ApplicationContext}.
     */
    @Inject
    public GestorSesion(@ApplicationContext Context contexto) {
        // MODE_PRIVATE: el fichero de preferencias solo es accesible por esta app.
        this.prefs = contexto.getSharedPreferences(
            Constantes.PREFS_SESION,
            Context.MODE_PRIVATE
        );
    }

    // ── Tokens ───────────────────────────────────────────────────────────────

    /**
     * Guarda (o sobrescribe) el par de tokens JWT de la sesión actual.
     *
     * @param tokenAcceso  token de acceso (JWT de corta duración, usado en
     *                      el header Authorization de cada petición).
     * @param tokenRefresh token de refresco (de mayor duración, usado para
     *                      obtener un nuevo token de acceso cuando caduca).
     */
    public void guardarTokens(String tokenAcceso, String tokenRefresh) {
        prefs.edit()
            .putString(Constantes.CLAVE_TOKEN_ACCESO,  tokenAcceso)
            .putString(Constantes.CLAVE_TOKEN_REFRESH, tokenRefresh)
            .apply();
    }

    /**
     * @return el token de acceso actual, o {@code null} si no hay sesión iniciada.
     */
    public String obtenerTokenAcceso() {
        return prefs.getString(Constantes.CLAVE_TOKEN_ACCESO, null);
    }

    /**
     * @return el token de refresco actual, o {@code null} si no hay sesión iniciada.
     */
    public String obtenerTokenRefresh() {
        return prefs.getString(Constantes.CLAVE_TOKEN_REFRESH, null);
    }

    /**
     * @return {@code true} si existe un token de acceso almacenado (hay sesión).
     */
    public boolean hayTokenAcceso() {
        return obtenerTokenAcceso() != null;
    }

    /**
     * @return {@code true} si existe un token de refresco almacenado.
     */
    public boolean hayTokenRefresh() {
        return obtenerTokenRefresh() != null;
    }

    // ── Datos del usuario ────────────────────────────────────────────────────

    /**
     * Guarda los datos básicos del usuario autenticado, usados para
     * personalizar la UI (saludo, control de permisos por rol, etc.)
     * sin tener que pedirlos de nuevo al backend.
     *
     * @param id     identificador del usuario.
     * @param rol    rol del usuario (ver {@link Constantes#ROL_CLIENTE},
     *                {@link Constantes#ROL_DISENADOR}, {@link Constantes#ROL_ADMIN}).
     * @param nombre nombre visible del usuario.
     */
    public void guardarDatosUsuario(String id, String rol, String nombre) {
        prefs.edit()
            .putString(Constantes.CLAVE_USUARIO_ID,     id)
            .putString(Constantes.CLAVE_USUARIO_ROL,    rol)
            .putString(Constantes.CLAVE_USUARIO_NOMBRE, nombre)
            .apply();
    }

    /** @return el id del usuario en sesión, o cadena vacía si no hay datos guardados. */
    public String obtenerUsuarioId()     { return prefs.getString(Constantes.CLAVE_USUARIO_ID, ""); }
    /** @return el rol del usuario en sesión, o cadena vacía si no hay datos guardados. */
    public String obtenerUsuarioRol()    { return prefs.getString(Constantes.CLAVE_USUARIO_ROL, ""); }
    /** @return el nombre del usuario en sesión, o cadena vacía si no hay datos guardados. */
    public String obtenerUsuarioNombre() { return prefs.getString(Constantes.CLAVE_USUARIO_NOMBRE, ""); }

    // ── Onboarding ───────────────────────────────────────────────────────────

    /**
     * @return {@code true} si el usuario ya ha visto las pantallas de
     *         onboarding (introducción) en algún momento.
     */
    public boolean onboardingYaVisto() {
        return prefs.getBoolean(Constantes.CLAVE_ONBOARDING_VISTO, false);
    }

    /** Marca el onboarding como visto, para no volver a mostrarlo. */
    public void marcarOnboardingVisto() {
        prefs.edit().putBoolean(Constantes.CLAVE_ONBOARDING_VISTO, true).apply();
    }

    // ── Cierre de sesión ─────────────────────────────────────────────────────

    /**
     * Cierra la sesión actual: elimina tokens y datos del usuario.
     *
     * El flag de onboarding se preserva intencionadamente: si el usuario ya
     * vio la introducción, no debe volver a verla tras cerrar sesión y
     * volver a iniciarla (no es información sensible de la cuenta).
     */
    public void cerrarSesion() {
        // Se conserva el flag de onboarding para no repetirlo tras re-login
        boolean onboardingVisto = onboardingYaVisto();
        prefs.edit().clear().apply();
        marcarOnboardingVisto();
        // Si el onboarding NO se había visto antes de limpiar, no hay que
        // "inventar" que sí se vio: se revierte el marcado que se acaba de hacer.
        if (!onboardingVisto) {
            prefs.edit().remove(Constantes.CLAVE_ONBOARDING_VISTO).apply();
        }
    }
}
