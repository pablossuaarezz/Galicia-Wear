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

    /** Constructor privado: clase de solo métodos estáticos, no instanciable. */
    private FormatoFechas() { /* No instanciable */ }

    /** Locale español (España) usado para los nombres de mes ("ene", "jun"...). */
    private static final Locale ES = new Locale("es", "ES");

    /**
     * Devuelve la fecha en formato "d MMM yyyy" (ej. "6 jun 2026").
     *
     * @param iso fecha en formato ISO-8601 tal y como la envía el backend
     *             (p. ej. "2026-06-06T10:30:00.000Z"); puede ser {@code null}.
     * @return la fecha formateada en español, o el propio valor de entrada
     *         (o cadena vacía) si no se pudo interpretar.
     */
    public static String fechaCorta(String iso) {
        Date fecha = parsear(iso);
        if (fecha == null) return iso != null ? iso : "";
        SimpleDateFormat salida = new SimpleDateFormat("d MMM yyyy", ES);
        return salida.format(fecha);
    }

    /**
     * Devuelve la fecha con hora "d MMM yyyy · HH:mm" (ej. "6 jun 2026 · 10:30").
     *
     * @param iso fecha en formato ISO-8601 tal y como la envía el backend;
     *             puede ser {@code null}.
     * @return la fecha y hora formateadas en español, o el propio valor de
     *         entrada (o cadena vacía) si no se pudo interpretar.
     */
    public static String fechaConHora(String iso) {
        Date fecha = parsear(iso);
        if (fecha == null) return iso != null ? iso : "";
        SimpleDateFormat salida = new SimpleDateFormat("d MMM yyyy · HH:mm", ES);
        return salida.format(fecha);
    }

    /**
     * Intenta convertir una cadena ISO-8601 del backend a {@link Date},
     * probando varios patrones habituales por tolerancia a pequeñas
     * diferencias de formato entre endpoints.
     *
     * @param iso cadena de fecha a interpretar; puede ser {@code null} o vacía.
     * @return el {@link Date} resultante, o {@code null} si no se pudo
     *         interpretar con ninguno de los patrones soportados.
     */
    private static Date parsear(String iso) {
        if (iso == null || iso.isEmpty()) return null;
        // Intento 1: ISO completo en UTC (con milisegundos y Z).
        for (String patron : new String[]{
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss"}) {
            try {
                SimpleDateFormat entrada = new SimpleDateFormat(patron, Locale.US);
                // Solo los patrones terminados en 'Z' representan UTC explícito;
                // se fija el TimeZone para que el parseo no aplique el huso horario local.
                if (patron.endsWith("'Z'")) entrada.setTimeZone(TimeZone.getTimeZone("UTC"));
                return entrada.parse(iso);
            } catch (Exception ignorado) { /* probamos el siguiente patrón */ }
        }
        // Intento 2: solo la parte de fecha (primeros 10 caracteres "yyyy-MM-dd").
        try {
            return new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso.substring(0, 10));
        } catch (Exception ignorado) {
            return null;
        }
    }
}
