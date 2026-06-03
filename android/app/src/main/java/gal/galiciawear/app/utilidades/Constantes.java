package gal.galiciawear.app.utilidades;

/**
 * Constantes globales de la aplicación.
 * Centralizar aquí evita "magic strings" dispersos por el código
 * y facilita los cambios de configuración sin búsquedas masivas.
 */
public final class Constantes {

    private Constantes() { /* No instanciable */ }

    // ── SharedPreferences ────────────────────────────────────────────────────
    public static final String PREFS_SESION        = "galiciawear_sesion";
    public static final String CLAVE_TOKEN_ACCESO  = "token_acceso";
    public static final String CLAVE_TOKEN_REFRESH = "token_refresh";
    public static final String CLAVE_USUARIO_ID    = "usuario_id";
    public static final String CLAVE_USUARIO_ROL   = "usuario_rol";
    public static final String CLAVE_USUARIO_NOMBRE= "usuario_nombre";
    public static final String CLAVE_ONBOARDING_VISTO = "onboarding_visto";

    // ── Intentos (extras) ────────────────────────────────────────────────────
    public static final String EXTRA_PRODUCTO_SLUG = "producto_slug";
    public static final String EXTRA_PEDIDO_ID     = "pedido_id";
    public static final String EXTRA_DISENADOR_ID  = "disenador_id";
    public static final String EXTRA_DISENADOR_NOMBRE = "disenador_nombre";
    // Id de la prenda a editar; ausente/null indica alta de prenda nueva.
    public static final String EXTRA_PRENDA_ID     = "prenda_id";
    // Indica que el perfil de diseñador se abre como paso del alta (tras registrarse).
    public static final String EXTRA_ONBOARDING_DISENADOR = "onboarding_disenador";

    // ── Notificaciones ───────────────────────────────────────────────────────
    public static final int ID_NOTIF_PEDIDO     = 1001;
    public static final int ID_NOTIF_MENSAJE    = 1002;
    public static final int ID_NOTIF_GENERICO   = 1003;

    // ── Roles usuario ────────────────────────────────────────────────────────
    public static final String ROL_CLIENTE    = "CLIENTE";
    public static final String ROL_DISENADOR  = "DISENADOR";
    public static final String ROL_ADMIN      = "ADMIN";

    // ── Paginación ───────────────────────────────────────────────────────────
    public static final int PAGINA_TAMANO = 20;
}
