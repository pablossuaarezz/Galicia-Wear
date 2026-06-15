package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoContadorNotificaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioNotificaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoNotificacion;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionTokenFcm;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;
import gal.galiciawear.app.utilidades.RespuestasApi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio de la bandeja de notificaciones (REST). El tiempo real lo aporta
 * {@link RepositorioChat} (escucha "nueva_notificacion" en el mismo socket autenticado),
 * así que aquí solo van el historial, el contador del badge y el marcado de leídas.
 *
 * Mismo patrón que {@link RepositorioChat}: métodos que devuelven LiveData con RecursoUi.
 */
@Singleton
public class RepositorioNotificaciones {

    private final ServicioApi servicioApi;
    private final GestorSesion gestorSesion;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para los endpoints de notificaciones.
     * @param gestorSesion usado para comprobar si hay sesión iniciada antes
     *                       de registrar el token FCM.
     */
    @Inject
    public RepositorioNotificaciones(ServicioApi servicioApi, GestorSesion gestorSesion) {
        this.servicioApi = servicioApi;
        this.gestorSesion = gestorSesion;
    }

    /** Primera página de la bandeja (suficiente para la demo; el TTL en Mongo es 60 días). */
    public MutableLiveData<RecursoUi<List<DtoNotificacion>>> listar() {
        MutableLiveData<RecursoUi<List<DtoNotificacion>>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.listarNotificaciones(1, 50).enqueue(new Callback<DtoEnvoltorioNotificaciones>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioNotificaciones> c,
                                   Response<DtoEnvoltorioNotificaciones> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().notificaciones));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoEnvoltorioNotificaciones> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /** Contador de no leídas para el badge (0 ante error: el badge se oculta). */
    public MutableLiveData<Integer> contador() {
        MutableLiveData<Integer> res = new MutableLiveData<>();
        servicioApi.contadorNotificaciones().enqueue(new Callback<DtoContadorNotificaciones>() {
            @Override
            public void onResponse(Call<DtoContadorNotificaciones> c,
                                   Response<DtoContadorNotificaciones> r) {
                res.postValue(r.isSuccessful() && r.body() != null ? r.body().noLeidas : 0);
            }
            @Override
            public void onFailure(Call<DtoContadorNotificaciones> c, Throwable t) {
                res.postValue(0);
            }
        });
        return res;
    }

    /** Marca una notificación como leída (fire-and-forget). */
    public void marcarLeida(String id) {
        servicioApi.marcarNotificacionLeida(id).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) { /* sin acción */ }
            @Override public void onFailure(Call<Void> c, Throwable t) { /* sin acción */ }
        });
    }

    /** Marca todas como leídas; el resultado (éxito/fallo) sirve para refrescar la bandeja. */
    public MutableLiveData<Boolean> marcarTodasLeidas() {
        MutableLiveData<Boolean> res = new MutableLiveData<>();
        servicioApi.marcarTodasNotificacionesLeidas().enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) {
                res.postValue(r.isSuccessful());
            }
            @Override public void onFailure(Call<Void> c, Throwable t) {
                res.postValue(false);
            }
        });
        return res;
    }

    /**
     * Registra el token FCM del dispositivo (best-effort). Solo se envía si hay sesión
     * iniciada; si no, no tiene sentido (el backend lo asocia al usuario autenticado).
     */
    public void registrarTokenFcm(String token) {
        if (token == null || token.isEmpty() || !gestorSesion.hayTokenAcceso()) return;
        servicioApi.registrarTokenFcm(new DtoPeticionTokenFcm(token)).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) { /* sin acción */ }
            @Override public void onFailure(Call<Void> c, Throwable t) { /* sin acción */ }
        });
    }
}
