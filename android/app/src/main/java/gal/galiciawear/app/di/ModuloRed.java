package gal.galiciawear.app.di;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import gal.galiciawear.app.BuildConfig;
import gal.galiciawear.app.datos.remoto.InterceptorJwt;
import gal.galiciawear.app.datos.remoto.ServicioApi;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Módulo Hilt que provee las dependencias de red.
 *
 * JUSTIFICACIÓN de @InstallIn(SingletonComponent.class): Retrofit y OkHttp
 * son costosos de crear (pool de conexiones, DNS cache). Deben ser Singletons
 * para que todos los repositorios compartan la misma instancia.
 */
@Module
@InstallIn(SingletonComponent.class)
public class ModuloRed {

    /**
     * Provee la instancia compartida de {@link Gson} para (de)serializar JSON.
     *
     * @return un Gson configurado para el formato de fechas y nulos del backend.
     */
    @Provides
    @Singleton
    public Gson proveerGson() {
        // serializeNulls: el backend espera campos explícitos aunque sean null
        return new GsonBuilder()
            .serializeNulls()
            // El backend (Node/Prisma) serializa las fechas en formato ISO-8601
            // UTC con milisegundos; este patrón debe coincidir exactamente
            // para que Gson pueda parsear las fechas que llegan en las respuestas.
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create();
    }

    /**
     * Provee el interceptor de logging HTTP usado por OkHttp.
     *
     * @return interceptor configurado con nivel BODY en debug (para depurar
     *         peticiones/respuestas completas) y NONE en release.
     */
    @Provides
    @Singleton
    public HttpLoggingInterceptor proveerLoggingInterceptor() {
        HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
        // En release no loguear bodies (seguridad: evita tokens en logs)
        interceptor.setLevel(
            BuildConfig.DEBUG
                ? HttpLoggingInterceptor.Level.BODY
                : HttpLoggingInterceptor.Level.NONE
        );
        return interceptor;
    }

    /**
     * Provee el cliente OkHttp compartido, con los interceptores de
     * autenticación (JWT) y logging ya registrados.
     *
     * @param interceptorJwt   interceptor que añade el header Authorization
     *                          con el token de acceso a cada petición.
     * @param interceptorLog   interceptor de logging HTTP (ver
     *                          {@link #proveerLoggingInterceptor()}).
     * @return cliente OkHttp configurado.
     */
    @Provides
    @Singleton
    public OkHttpClient proveerOkHttp(
        InterceptorJwt interceptorJwt,
        HttpLoggingInterceptor interceptorLog
    ) {
        return new OkHttpClient.Builder()
            // Orden relevante: JWT primero (añade el header), logging al final
            .addInterceptor(interceptorJwt)
            .addInterceptor(interceptorLog)
            .build();
    }

    /**
     * Provee la instancia de Retrofit configurada con la URL base de la API
     * y el conversor Gson para JSON.
     *
     * @param cliente cliente OkHttp con los interceptores ya aplicados.
     * @param gson    instancia de Gson para la conversión de JSON.
     * @return instancia de Retrofit lista para crear servicios.
     */
    @Provides
    @Singleton
    public Retrofit proveerRetrofit(OkHttpClient cliente, Gson gson) {
        return new Retrofit.Builder()
            .baseUrl(BuildConfig.URL_BASE_API)
            .client(cliente)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build();
    }

    /**
     * Provee la implementación generada por Retrofit de {@link ServicioApi},
     * la interfaz con todos los endpoints REST consumidos por la app.
     *
     * @param retrofit instancia de Retrofit ya configurada.
     * @return implementación proxy de ServicioApi generada en tiempo de ejecución.
     */
    @Provides
    @Singleton
    public ServicioApi proveerServicioApi(Retrofit retrofit) {
        return retrofit.create(ServicioApi.class);
    }
}
