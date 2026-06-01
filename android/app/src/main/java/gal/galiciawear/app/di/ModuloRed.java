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

    @Provides
    @Singleton
    public Gson proveerGson() {
        // serializeNulls: el backend espera campos explícitos aunque sean null
        return new GsonBuilder()
            .serializeNulls()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create();
    }

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

    @Provides
    @Singleton
    public Retrofit proveerRetrofit(OkHttpClient cliente, Gson gson) {
        return new Retrofit.Builder()
            .baseUrl(BuildConfig.URL_BASE_API)
            .client(cliente)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build();
    }

    @Provides
    @Singleton
    public ServicioApi proveerServicioApi(Retrofit retrofit) {
        return retrofit.create(ServicioApi.class);
    }
}
