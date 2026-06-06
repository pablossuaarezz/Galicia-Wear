package gal.galiciawear.app.utilidades;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Formatea las fechas ISO-8601 que devuelve el backend (p. ej.
 * {@code "2026-06-06T10:30:00.000Z"}) a un texto legible en español
 * ({@code "6 jun 2026"}). Se usa SimpleDateFormat (compatible con cualquier
 * minSdk) en lugar de java.time para no depender del desugaring.
 */
public final class FormatoFechas {

    private FormatoFechas() { /* No instanciable */ }

    private static final Locale ES = new Locale("es", "ES");

    /** Devuelve la fecha en formato "d MMM yyyy" (ej. "6 jun 2026"). */
    public static String fechaCorta(String iso) {
        Date fecha = parsear(iso);
        if (fecha == null) return iso != null ? iso : "";
        SimpleDateFormat salida = new SimpleDateFormat("d MMM yyyy", ES);
        return salida.format(fecha);
    }

    /** Devuelve la fecha con hora "d MMM yyyy · HH:mm" (ej. "6 jun 2026 · 10:30"). */
    public static String fechaConHora(String iso) {
        Date fecha = parsear(iso);
        if (fecha == null) return iso != null ? iso : "";
        SimpleDateFormat salida = new SimpleDateFormat("d MMM yyyy · HH:mm", ES);
        return salida.format(fecha);
    }

    private static Date parsear(String iso) {
        if (iso == null || iso.isEmpty()) return null;
        // Intento 1: ISO completo en UTC (con milisegundos y Z).
        for (String patron : new String[]{
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss"}) {
            try {
                SimpleDateFormat entrada = new SimpleDateFormat(patron, Locale.US);
                if (patron.endsWith("'Z'")) entrada.setTimeZone(TimeZone.getTimeZone("UTC"));
                return entrada.parse(iso);
            } catch (Exception ignorado) { /* probamos el siguiente patrón */ }
        }
        // Intento 2: solo la parte de fecha.
        try {
            return new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso.substring(0, 10));
        } catch (Exception ignorado) {
            return null;
        }
    }
}
