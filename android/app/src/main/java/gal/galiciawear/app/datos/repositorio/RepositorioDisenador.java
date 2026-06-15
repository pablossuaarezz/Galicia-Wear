package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaDisenador;
import gal.galiciawear.app.utilidades.RecursoUi;
import gal.galiciawear.app.utilidades.RespuestasApi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio del perfil de diseñador (marca). Encapsula el alta del perfil
 * (POST /disenadores/solicitar), su lectura (GET /disenadores/yo) y su
 * actualización (PATCH /disenadores/yo). La activación la realiza un admin
 * desde el panel JavaFX; aquí el perfil nace con validado=false.
 */
@Singleton
public class RepositorioDisenador {

    private final ServicioApi servicioApi;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para los endpoints de diseñador.
     */
    @Inject
    public RepositorioDisenador(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    /** Carga el perfil propio. EXITO con datos=null cuando aún no existe (404). */
    public MutableLiveData<RecursoUi<DtoDisenador>> obtenerMiPerfil() {
        MutableLiveData<RecursoUi<DtoDisenador>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.obtenerMiPerfilDisenador().enqueue(new Callback<DtoRespuestaDisenador>() {
            @Override
            public void onResponse(Call<DtoRespuestaDisenador> c, Response<DtoRespuestaDisenador> r) {
                if (r.isSuccessful() && r.body() != null) {
                    resultado.postValue(RecursoUi.exito(r.body().disenador));
                } else if (r.code() == 404) {
                    // Aún no ha completado su perfil: estado válido, sin datos.
                    resultado.postValue(RecursoUi.exito(null));
                } else {
                    resultado.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaDisenador> c, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return resultado;
    }

    /** Crea (alta) o actualiza el perfil según {@code esAlta}. */
    public MutableLiveData<RecursoUi<DtoDisenador>> guardarPerfil(
        DtoPeticionDisenador cuerpo, boolean esAlta) {
        MutableLiveData<RecursoUi<DtoDisenador>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        Call<DtoRespuestaDisenador> llamada = esAlta
            ? servicioApi.solicitarPerfilDisenador(cuerpo)
            : servicioApi.actualizarPerfilDisenador(cuerpo);

        llamada.enqueue(new Callback<DtoRespuestaDisenador>() {
            @Override
            public void onResponse(Call<DtoRespuestaDisenador> c, Response<DtoRespuestaDisenador> r) {
                if (r.isSuccessful() && r.body() != null) {
                    resultado.postValue(RecursoUi.exito(r.body().disenador));
                } else {
                    resultado.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaDisenador> c, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return resultado;
    }
}
