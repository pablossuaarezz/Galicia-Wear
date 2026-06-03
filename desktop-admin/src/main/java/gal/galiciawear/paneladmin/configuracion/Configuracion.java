package gal.galiciawear.paneladmin.configuracion;

/**
 * Configuración de la aplicación. La URL base de la API REST se toma de la variable de entorno
 * {@code GALICIAWEAR_API_URL}; si no está definida se usa el backend local por defecto.
 *
 * <p>El panel NO accede a ninguna base de datos directamente: todo pasa por la API REST, que es
 * quien habla con MySQL y MongoDB remotas.
 */
public final class Configuracion {

    private static final String URL_POR_DEFECTO = "http://localhost:3000";

    private Configuracion() {
    }

    /** URL base de la API REST, sin barra final. */
    public static String urlBaseApi() {
        String valor = System.getenv("GALICIAWEAR_API_URL");
        if (valor == null || valor.isBlank()) {
            valor = System.getProperty("galiciawear.api.url", URL_POR_DEFECTO);
        }
        // Normaliza: elimina la barra final si la hubiera
        return valor.endsWith("/") ? valor.substring(0, valor.length() - 1) : valor;
    }
}
