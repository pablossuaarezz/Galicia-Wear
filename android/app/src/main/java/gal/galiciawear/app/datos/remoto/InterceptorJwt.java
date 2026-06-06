package gal.galiciawear.app.datos.remoto;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Singleton;

import com.google.gson.Gson;

import gal.galiciawear.app.BuildConfig;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.sesion.GestorSesion;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Interceptor OkHttp que añade el JWT de acceso a cada petición y, si el backend
 * responde 401 (token expirado), intenta renovarlo automáticamente con el refresh
 * token y reintenta la petición original. Solo si el refresco falla se cierra sesión.
 *
 * El access token caduca a los 15 min; sin este refresco, cualquier acción
 * autenticada (p. ej. añadir al carrito) dejaba de funcionar pasado ese tiempo.
 *
 * El refresco se hace dentro de un bloque synchronized para que, ante varios 401
 * simultáneos, solo un hilo renueve y el resto reutilice el token ya renovado.
 * Se usa un OkHttpClient aparte (sin este interceptor) para evitar recursión.
 */
@Singleton
public class InterceptorJwt implements Interceptor {

    private final GestorSesion gestorSesion;
    private final OkHttpClient clienteRefresco = new OkHttpClient();
    private final Gson gson = new Gson();

    @Inject
    public InterceptorJwt(GestorSesion gestorSesion) {
        this.gestorSesion = gestorSesion;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        String token = gestorSesion.obtenerTokenAcceso();
        Response respuesta = chain.proceed(añadirToken(original, token));

        if (respuesta.code() != 401 || esRutaPublica(original)) {
            return respuesta;
        }

        // 401 en ruta autenticada → renovar el token una vez y reintentar.
        synchronized (this) {
            String tokenActual = gestorSesion.obtenerTokenAcceso();
            String nuevoToken;
            if (tokenActual != null && !tokenActual.equals(token)) {
                // Otro hilo ya renovó mientras esperábamos el lock.
                nuevoToken = tokenActual;
            } else {
                nuevoToken = refrescarToken();
            }

            if (nuevoToken == null) {
                gestorSesion.cerrarSesion();
                return respuesta;
            }

            respuesta.close();
            return chain.proceed(añadirToken(original, nuevoToken));
        }
    }

    private Request añadirToken(Request peticion, String token) {
        if (token == null || token.isEmpty()) return peticion;
        return peticion.newBuilder()
            .header("Authorization", "Bearer " + token)
            .build();
    }

    /**
     * Llama a POST /auth/refresh con el refresh token guardado; si tiene éxito,
     * persiste los tokens nuevos y devuelve el nuevo access token. Si falla
     * (sin refresh token, red, o refresh inválido), devuelve null.
     */
    private String refrescarToken() {
        String refresh = gestorSesion.obtenerTokenRefresh();
        if (refresh == null || refresh.isEmpty()) return null;

        try {
            Map<String, String> cuerpo = new HashMap<>();
            cuerpo.put("tokenRefresco", refresh);
            RequestBody body = RequestBody.create(
                MediaType.parse("application/json; charset=utf-8"),
                gson.toJson(cuerpo)
            );
            Request peticion = new Request.Builder()
                .url(BuildConfig.URL_BASE_API + "auth/refresh")
                .post(body)
                .build();

            try (Response resp = clienteRefresco.newCall(peticion).execute()) {
                if (!resp.isSuccessful() || resp.body() == null) return null;
                DtoRespuestaToken dto = gson.fromJson(resp.body().string(), DtoRespuestaToken.class);
                if (dto == null || dto.tokenAcceso == null) return null;
                String nuevoRefresh = dto.tokenRefresh != null ? dto.tokenRefresh : refresh;
                gestorSesion.guardarTokens(dto.tokenAcceso, nuevoRefresh);
                return dto.tokenAcceso;
            }
        } catch (Exception e) {
            return null;
        }
    }

    // Las rutas de auth no llevan token y un 401 en ellas no implica renovar/cerrar.
    private boolean esRutaPublica(Request peticion) {
        String ruta = peticion.url().encodedPath();
        return ruta.contains("/auth/login")
            || ruta.contains("/auth/registro")
            || ruta.contains("/auth/refresh");
    }
}
