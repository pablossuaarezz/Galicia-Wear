package gal.galiciawear.app.datos.remoto;

import java.io.IOException;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.sesion.GestorSesion;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Interceptor OkHttp que añade el JWT de acceso a cada petición saliente.
 *
 * JUSTIFICACIÓN: Centralizar la inyección del token aquí evita repetir
 * el header "Authorization: Bearer ..." en cada llamada de Retrofit.
 * Si el server devuelve 401, limpiamos la sesión para forzar el re-login.
 * Un refresh automático real requeriría un mutex (synchronized) para evitar
 * que múltiples hilos refresquen a la vez; para el TFG, el logout en 401
 * es la estrategia de seguridad por defecto.
 */
@Singleton
public class InterceptorJwt implements Interceptor {

    private final GestorSesion gestorSesion;

    @Inject
    public InterceptorJwt(GestorSesion gestorSesion) {
        this.gestorSesion = gestorSesion;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        String token = gestorSesion.obtenerTokenAcceso();

        Request peticion = chain.request();

        if (token != null && !token.isEmpty()) {
            peticion = peticion.newBuilder()
                .addHeader("Authorization", "Bearer " + token)
                .build();
        }

        Response respuesta = chain.proceed(peticion);

        // 401 = token expirado o inválido → cerrar sesión localmente
        if (respuesta.code() == 401 && !esRutaPublica(peticion)) {
            gestorSesion.cerrarSesion();
        }

        return respuesta;
    }

    // Las rutas de auth no llevan token y un 401 en ellas no implica cerrar sesión
    private boolean esRutaPublica(Request peticion) {
        String ruta = peticion.url().encodedPath();
        return ruta.contains("/auth/login")
            || ruta.contains("/auth/registro")
            || ruta.contains("/auth/refresh");
    }
}
