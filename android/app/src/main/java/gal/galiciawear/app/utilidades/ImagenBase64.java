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

    private ImagenBase64() { /* No instanciable */ }

    private static final int LADO_MAXIMO = 512;   // px del lado mayor
    private static final int CALIDAD_JPEG = 80;   // 0-100
    private static final String PREFIJO = "data:image/jpeg;base64,";

    /**
     * Lee la imagen seleccionada por el usuario, la reduce y la devuelve como
     * data URI base64. Devuelve null si no se puede leer.
     */
    public static String desdeUri(ContentResolver resolver, Uri uri) {
        Bitmap bitmap = decodificarReducido(resolver, uri);
        if (bitmap == null) return null;
        return desdeBitmap(bitmap);
    }

    /** Codifica un bitmap (ya reducido) como data URI JPEG base64. */
    public static String desdeBitmap(Bitmap bitmap) {
        Bitmap escalado = escalar(bitmap, LADO_MAXIMO);
        java.io.ByteArrayOutputStream salida = new java.io.ByteArrayOutputStream();
        escalado.compress(Bitmap.CompressFormat.JPEG, CALIDAD_JPEG, salida);
        String base64 = Base64.encodeToString(salida.toByteArray(), Base64.NO_WRAP);
        return PREFIJO + base64;
    }

    /**
     * Decodifica un data URI (o base64 puro) a Bitmap. Devuelve null si el
     * texto no es base64 (p. ej. una URL http, que se cargaría con Glide).
     */
    public static Bitmap aBitmap(String dataUri) {
        if (dataUri == null || dataUri.isEmpty()) return null;
        if (!dataUri.startsWith("data:")) return null;
        int coma = dataUri.indexOf(',');
        String base64 = coma >= 0 ? dataUri.substring(coma + 1) : dataUri;
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** ¿El valor es una imagen base64 incrustada (vs. una URL remota)? */
    public static boolean esDataUri(String valor) {
        return valor != null && valor.startsWith("data:");
    }

    // ── Internos ──────────────────────────────────────────────────────────────

    /** Decodifica desde el Uri usando inSampleSize para no cargar la foto entera. */
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

    private static int calcularInSampleSize(int ancho, int alto, int objetivo) {
        int sample = 1;
        int mayor = Math.max(ancho, alto);
        while (mayor / sample > objetivo * 2) sample *= 2;
        return sample;
    }

    /** Escala manteniendo proporción para que el lado mayor sea <= ladoMax. */
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
