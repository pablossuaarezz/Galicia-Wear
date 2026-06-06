package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioListaDirecciones;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaDireccion;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@Singleton
public class RepositorioDirecciones {

    private final ServicioApi servicioApi;

    @Inject
    public RepositorioDirecciones(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    public MutableLiveData<RecursoUi<List<DtoRespuestaDireccion>>> listarDirecciones() {
        MutableLiveData<RecursoUi<List<DtoRespuestaDireccion>>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.listarDirecciones().enqueue(new Callback<DtoEnvoltorioListaDirecciones>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioListaDirecciones> call,
                                   Response<DtoEnvoltorioListaDirecciones> r) {
                if (r.isSuccessful() && r.body() != null && r.body().direcciones != null) {
                    resultado.postValue(RecursoUi.exito(r.body().direcciones));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudieron cargar las direcciones"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioListaDirecciones> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }

    /** Crea una nueva dirección de envío para el usuario autenticado. */
    public MutableLiveData<RecursoUi<DtoRespuestaDireccion>> crearDireccion(DtoPeticionDireccion peticion) {
        MutableLiveData<RecursoUi<DtoRespuestaDireccion>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.crearDireccion(peticion).enqueue(new Callback<DtoEnvoltorioDireccion>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioDireccion> call,
                                   Response<DtoEnvoltorioDireccion> r) {
                if (r.isSuccessful() && r.body() != null && r.body().direccion != null) {
                    resultado.postValue(RecursoUi.exito(r.body().direccion));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudo guardar la dirección"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioDireccion> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }
}
