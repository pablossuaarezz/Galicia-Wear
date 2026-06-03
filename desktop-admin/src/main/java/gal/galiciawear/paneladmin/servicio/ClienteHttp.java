package gal.galiciawear.paneladmin.servicio;

import com.fasterxml.jackson.databind.JsonNode;
import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

/**
 * Cliente HTTP único hacia la API REST. Añade automáticamente la cabecera
 * {@code Authorization: Bearer <token>} y, si una petición devuelve 401, intenta refrescar la
 * pareja de tokens contra {@code /auth/refresh} y reintenta la petición una sola vez.
 *
 * <p>Es inyectable (URL base + {@link GestorSesion}) para poder apuntarlo a un MockWebServer en
 * los tests sin tocar el resto de la aplicación.
 */
public class ClienteHttp {

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient cliente;
    private final String urlBase;
    private final GestorSesion sesion;

    public ClienteHttp(String urlBase, GestorSesion sesion) {
        this.urlBase = urlBase.endsWith("/") ? urlBase.substring(0, urlBase.length() - 1) : urlBase;
        this.sesion = sesion;
        this.cliente = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(20))
                .addInterceptor(this::interceptarAutorizacion)
                .build();
    }

    // ---- Interceptor que inyecta el token de acceso vigente en cada petición ----
    private Response interceptarAutorizacion(Interceptor.Chain cadena) throws IOException {
        Request original = cadena.request();
        String token = sesion.getTokenAcceso();
        if (token == null) {
            return cadena.proceed(original);
        }
        Request autorizada = original.newBuilder()
                .header("Authorization", "Bearer " + token)
                .build();
        return cadena.proceed(autorizada);
    }

    // ---- Verbos HTTP ----

    public RespuestaHttp get(String ruta) {
        return enviarConRefresco(() -> new Request.Builder().url(urlBase + ruta).get().build());
    }

    public RespuestaHttp post(String ruta, String cuerpoJson) {
        return enviarConRefresco(() -> new Request.Builder()
                .url(urlBase + ruta)
                .post(RequestBody.create(cuerpoJson == null ? "" : cuerpoJson, JSON))
                .build());
    }

    public RespuestaHttp patch(String ruta, String cuerpoJson) {
        return enviarConRefresco(() -> new Request.Builder()
                .url(urlBase + ruta)
                .patch(RequestBody.create(cuerpoJson == null ? "" : cuerpoJson, JSON))
                .build());
    }

    public RespuestaHttp eliminar(String ruta) {
        return enviarConRefresco(() -> new Request.Builder().url(urlBase + ruta).delete().build());
    }

    // ---- Núcleo: ejecución + reintento tras refresco ----

    private RespuestaHttp enviarConRefresco(Supplier<Request> fabrica) {
        RespuestaHttp respuesta = ejecutar(fabrica.get());
        if (respuesta.codigo() == 401 && sesion.hayRefresco() && refrescar()) {
            // El interceptor añadirá automáticamente el nuevo token de acceso.
            respuesta = ejecutar(fabrica.get());
        }
        return respuesta;
    }

    private RespuestaHttp ejecutar(Request peticion) {
        try (Response respuesta = cliente.newCall(peticion).execute()) {
            String cuerpo = respuesta.body() != null ? respuesta.body().string() : "";
            return new RespuestaHttp(respuesta.code(), cuerpo);
        } catch (IOException e) {
            throw new ErrorApi("No se pudo conectar con el servidor (" + urlBase + "): " + e.getMessage(), e);
        }
    }

    /** Intenta renovar la pareja de tokens. Devuelve true si lo consigue. */
    private boolean refrescar() {
        String refresco = sesion.getTokenRefresco();
        if (refresco == null) {
            return false;
        }
        String cuerpo = "{\"tokenRefresco\":\"" + refresco + "\"}";
        Request peticion = new Request.Builder()
                .url(urlBase + "/auth/refresh")
                .post(RequestBody.create(cuerpo, JSON))
                .build();
        RespuestaHttp respuesta = ejecutar(peticion);
        if (!respuesta.exito()) {
            sesion.limpiar();
            return false;
        }
        JsonNode nodo = Json.leerArbol(respuesta.cuerpo());
        String nuevoAcceso = nodo.path("tokenAcceso").asText(null);
        String nuevoRefresco = nodo.path("tokenRefresco").asText(null);
        if (nuevoAcceso == null || nuevoRefresco == null) {
            return false;
        }
        sesion.actualizarTokens(nuevoAcceso, nuevoRefresco);
        return true;
    }
}
