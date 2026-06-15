package gal.galiciawear.app.utilidades;

import android.content.ContentResolver;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;

import java.io.InputStream;

/**
 * Convierte imágenes entre {@link Bitmap}/{@link Uri} y data URIs base64
 * para almacenarlas como texto en SQL (el proyecto no usa servidor de ficheros).
 *
 * Antes de codificar se reduce la imagen a un tamaño razonable para que el
 * data URI quepa holgadamente en la BD y la subida sea rápida.
 */
public final class ImagenBase64 {

    /** Constructor privado: clase de solo métodos estáticos, no instanciable. */
    private ImagenBase64() { /* No instanciable */ }

    /** Tamaño máximo (en píxeles) del lado mayor de la imagen tras escalarla. */
    private static final int LADO_MAXIMO = 512;   // px del lado mayor
    /** Calidad de compresión JPEG aplicada (0 = peor calidad, 100 = sin pérdida). */
    private static final int CALIDAD_JPEG = 80;   // 0-100
    /** Prefijo estándar de un data URI para imágenes JPEG en base64. */
    private static final String PREFIJO = "data:image/jpeg;base64,";

    /**
     * Lee la imagen seleccionada por el usuario, la reduce y la devuelve como
     * data URI base64. Devuelve null si no se puede leer.
     *
     * @param resolver ContentResolver para acceder al contenido del Uri
     *                  (normalmente {@code context.getContentResolver()}).
     * @param uri      Uri de la imagen seleccionada (p. ej. desde un selector
     *                  de galería).
     * @return data URI en formato {@code "data:image/jpeg;base64,..."}, o
     *         {@code null} si la imagen no se pudo decodificar.
     */
    public static String desdeUri(ContentResolver resolver, Uri uri) {
        Bitmap bitmap = decodificarReducido(resolver, uri);
        if (bitmap == null) return null;
        return desdeBitmap(bitmap);
    }

    /**
     * Codifica un bitmap (ya reducido) como data URI JPEG base64.
     *
     * @param bitmap imagen a codificar.
     * @return data URI con el bitmap escalado y comprimido en JPEG.
     */
    public static String desdeBitmap(Bitmap bitmap) {
        // Por si el bitmap recibido no ha pasado por decodificarReducido,
        // se vuelve a escalar aquí para garantizar el límite de tamaño.
        Bitmap escalado = escalar(bitmap, LADO_MAXIMO);
        java.io.ByteArrayOutputStream salida = new java.io.ByteArrayOutputStream();
        escalado.compress(Bitmap.CompressFormat.JPEG, CALIDAD_JPEG, salida);
        // NO_WRAP: no incluye saltos de línea en la cadena base64 (necesario
        // para poder concatenarla directamente en el data URI / JSON).
        String base64 = Base64.encodeToString(salida.toByteArray(), Base64.NO_WRAP);
        return PREFIJO + base64;
    }

    /**
     * Decodifica un data URI (o base64 puro) a Bitmap. Devuelve null si el
     * texto no es base64 (p. ej. una URL http, que se cargaría con Glide).
     *
     * @param dataUri cadena recibida del backend: puede ser un data URI
     *                 ({@code "data:image/...;base64,..."}), una URL remota
     *                 o {@code null}/vacía.
     * @return el {@link Bitmap} decodificado, o {@code null} si la cadena no
     *         es un data URI o si la decodificación falla.
     */
    public static Bitmap aBitmap(String dataUri) {
        if (dataUri == null || dataUri.isEmpty()) return null;
        if (!dataUri.startsWith("data:")) return null;
        // El data URI tiene forma "data:<mime>;base64,<contenido>"; solo nos
        // interesa la parte posterior a la primera coma.
        int coma = dataUri.indexOf(',');
        String base64 = coma >= 0 ? dataUri.substring(coma + 1) : dataUri;
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * ¿El valor es una imagen base64 incrustada (vs. una URL remota)?
     *
     * @param valor cadena a comprobar; puede ser {@code null}.
     * @return {@code true} si comienza por "data:" (data URI incrustado).
     */
    public static boolean esDataUri(String valor) {
        return valor != null && valor.startsWith("data:");
    }

    // ── Internos ──────────────────────────────────────────────────────────────

    /**
     * Decodifica desde el Uri usando inSampleSize para no cargar la foto entera.
     *
     * Se hacen dos pasadas sobre el InputStream: la primera solo lee las
     * dimensiones (sin reservar memoria para los píxeles), y la segunda
     * decodifica ya submuestreada según el factor calculado.
     *
     * @param resolver ContentResolver para abrir el Uri.
     * @param uri      Uri de la imagen original.
     * @return el {@link Bitmap} decodificado y reducido, o {@code null} si
     *         falla la lectura/decodificación.
     */
    private static Bitmap decodificarReducido(ContentResolver resolver, Uri uri) {
        try {
            // 1ª pasada: solo dimensiones.
            BitmapFactory.Options soloLimites = new BitmapFactory.Options();
            soloLimites.inJustDecodeBounds = true;
            try (InputStream is = resolver.openInputStream(uri)) {
                BitmapFactory.decodeStream(is, null, soloLimites);
            }
            // 2ª pasada: decodifica submuestreado.
            BitmapFactory.Options opciones = new BitmapFactory.Options();
            opciones.inSampleSize = calcularInSampleSize(
                soloLimites.outWidth, soloLimites.outHeight, LADO_MAXIMO);
            try (InputStream is = resolver.openInputStream(uri)) {
                return BitmapFactory.decodeStream(is, null, opciones);
            }
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Calcula la potencia de 2 más adecuada para {@code inSampleSize}, de
     * forma que la imagen decodificada tenga, como mucho, el doble del
     * tamaño objetivo (luego se reescala con precisión en {@link #escalar}).
     *
     * @param ancho    ancho original de la imagen, en píxeles.
     * @param alto     alto original de la imagen, en píxeles.
     * @param objetivo tamaño deseado del lado mayor, en píxeles.
     * @return factor de submuestreo (1, 2, 4, 8...) a pasar a
     *         {@code BitmapFactory.Options.inSampleSize}.
     */
    private static int calcularInSampleSize(int ancho, int alto, int objetivo) {
        int sample = 1;
        int mayor = Math.max(ancho, alto);
        while (mayor / sample > objetivo * 2) sample *= 2;
        return sample;
    }

    /**
     * Escala manteniendo proporción para que el lado mayor sea <= ladoMax.
     *
     * @param original bitmap de entrada.
     * @param ladoMax  tamaño máximo permitido para el lado mayor, en píxeles.
     * @return el bitmap original si ya cumple el límite, o una copia escalada
     *         manteniendo la proporción de aspecto.
     */
    private static Bitmap escalar(Bitmap original, int ladoMax) {
        int ancho = original.getWidth();
        int alto = original.getHeight();
        int mayor = Math.max(ancho, alto);
        if (mayor <= ladoMax) return original;
        float factor = (float) ladoMax / mayor;
        int nuevoAncho = Math.round(ancho * factor);
        int nuevoAlto = Math.round(alto * factor);
        return Bitmap.createScaledBitmap(original, nuevoAncho, nuevoAlto, true);
    }
}
