package gal.galiciawear.app.utilidades;

/**
 * Constantes globales de la aplicación.
 * Centralizar aquí evita "magic strings" dispersos por el código
 * y facilita los cambios de configuración sin búsquedas masivas.
 */
public final class Constantes {

    /** Constructor privado: clase de solo constantes, no instanciable. */
    private Constantes() { /* No instanciable */ }

    // ── SharedPreferences ────────────────────────────────────────────────────
    /** Nombre del fichero de SharedPreferences donde se guarda la sesión. */
    public static final String PREFS_SESION        = "galiciawear_sesion";
    /** Clave bajo la que se guarda el token de acceso (JWT corto). */
    public static final String CLAVE_TOKEN_ACCESO  = "token_acceso";
    /** Clave bajo la que se guarda el token de refresco (JWT largo). */
    public static final String CLAVE_TOKEN_REFRESH = "token_refresh";
    /** Clave bajo la que se guarda el id del usuario autenticado. */
    public static final String CLAVE_USUARIO_ID    = "usuario_id";
    /** Clave bajo la que se guarda el rol del usuario autenticado. */
    public static final String CLAVE_USUARIO_ROL   = "usuario_rol";
    /** Clave bajo la que se guarda el nombre del usuario autenticado. */
    public static final String CLAVE_USUARIO_NOMBRE= "usuario_nombre";
    /** Clave del flag que indica si el usuario ya vio el onboarding. */
    public static final String CLAVE_ONBOARDING_VISTO = "onboarding_visto";

    // ── Búsquedas recientes ──────────────────────────────────────────────────
    /** Nombre del fichero de SharedPreferences para el historial de búsquedas. */
    public static final String PREFS_BUSQUEDAS         = "galiciawear_busquedas";
    /** Clave bajo la que se guarda la cadena con las búsquedas recientes. */
    public static final String CLAVE_BUSQUEDAS_RECIENTES = "recientes";
    // Nº máximo de búsquedas recientes que se recuerdan (Ley de Miller: 7±2).
    public static final int    MAX_BUSQUEDAS_RECIENTES = 8;
    // Nº máximo de productos similares a mostrar cuando no hay resultados exactos.
    public static final int    MAX_PRODUCTOS_SIMILARES = 12;

    // ── Intentos (extras) ────────────────────────────────────────────────────
    /** Clave del extra con el slug del producto a mostrar en su detalle. */
    public static final String EXTRA_PRODUCTO_SLUG = "producto_slug";
    /** Clave del extra con el id del pedido a mostrar en su detalle. */
    public static final String EXTRA_PEDIDO_ID     = "pedido_id";
    /** Clave del extra con el id del diseñador (p. ej. para abrir el chat). */
    public static final String EXTRA_DISENADOR_ID  = "disenador_id";
    /** Clave del extra con el nombre del diseñador (para mostrar en el chat). */
    public static final String EXTRA_DISENADOR_NOMBRE = "disenador_nombre";
    // Id de la prenda a editar; ausente/null indica alta de prenda nueva.
    public static final String EXTRA_PRENDA_ID     = "prenda_id";
    // Indica que el perfil de diseñador se abre como paso del alta (tras registrarse).
    public static final String EXTRA_ONBOARDING_DISENADOR = "onboarding_disenador";
    // Pide a la actividad principal abrir directamente la pestaña del carrito.
    public static final String EXTRA_ABRIR_CARRITO = "abrir_carrito";
    // Datos del pedido recién creado para la pantalla de compra completada.
    /** Número/identificador legible del pedido recién creado. */
    public static final String EXTRA_PEDIDO_NUMERO      = "pedido_numero";
    /** Importe total del pedido recién creado. */
    public static final String EXTRA_PEDIDO_TOTAL       = "pedido_total";
    /** Método de pago usado en el pedido recién creado. */
    public static final String EXTRA_PEDIDO_METODO_PAGO = "pedido_metodo_pago";
    /** Indicador de impacto ecológico/sostenible del pedido recién creado. */
    public static final String EXTRA_PEDIDO_ECO         = "pedido_eco";

    // ── Notificaciones ───────────────────────────────────────────────────────
    /** Id de notificación usado para avisos relacionados con pedidos. */
    public static final int ID_NOTIF_PEDIDO     = 1001;
    /** Id de notificación usado para avisos de nuevos mensajes de chat. */
    public static final int ID_NOTIF_MENSAJE    = 1002;
    /** Id de notificación genérico para el resto de avisos. */
    public static final int ID_NOTIF_GENERICO   = 1003;

    // ── Roles usuario ────────────────────────────────────────────────────────
    /** Rol de cliente (usuario que compra productos). */
    public static final String ROL_CLIENTE    = "CLIENTE";
    /** Rol de diseñador (usuario que publica y vende prendas). */
    public static final String ROL_DISENADOR  = "DISENADOR";
    /** Rol de administrador (gestión y moderación de la plataforma). */
    public static final String ROL_ADMIN      = "ADMIN";

    // ── Paginación ───────────────────────────────────────────────────────────
    /** Nº de elementos solicitados por página en los listados paginados. */
    public static final int PAGINA_TAMANO = 20;
}
