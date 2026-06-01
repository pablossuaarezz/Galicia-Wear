package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.local.dao.DaoCarrito;
import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionCarritoItem;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@Singleton
public class RepositorioCarrito {

    private final ServicioApi servicioApi;
    private final DaoCarrito daoCarrito;
    private final ExecutorService ejecutorIo = Executors.newSingleThreadExecutor();

    @Inject
    public RepositorioCarrito(ServicioApi servicioApi, DaoCarrito daoCarrito) {
        this.servicioApi = servicioApi;
        this.daoCarrito  = daoCarrito;
    }

    public LiveData<Integer> observarContadorItems() {
        return daoCarrito.contarItems();
    }

    public MutableLiveData<RecursoUi<DtoRespuestaCarrito>> obtenerCarrito() {
        MutableLiveData<RecursoUi<DtoRespuestaCarrito>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.obtenerCarrito().enqueue(new Callback<DtoRespuestaCarrito>() {
            @Override
            public void onResponse(Call<DtoRespuestaCarrito> call, Response<DtoRespuestaCarrito> r) {
                if (r.isSuccessful() && r.body() != null) {
                    resultado.postValue(RecursoUi.exito(r.body()));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudo cargar el carrito"));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaCarrito> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaCarrito>> añadirItem(String varianteId, int cantidad) {
        MutableLiveData<RecursoUi<DtoRespuestaCarrito>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.añadirItemCarrito(new DtoPeticionCarritoItem(varianteId, cantidad))
            .enqueue(new Callback<DtoRespuestaCarrito>() {
                @Override
                public void onResponse(Call<DtoRespuestaCarrito> call, Response<DtoRespuestaCarrito> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        resultado.postValue(RecursoUi.exito(r.body()));
                    } else {
                        resultado.postValue(RecursoUi.error("No se pudo añadir al carrito"));
                    }
                }

                @Override
                public void onFailure(Call<DtoRespuestaCarrito> call, Throwable t) {
                    resultado.postValue(RecursoUi.error("Sin conexión"));
                }
            });

        return resultado;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaCarrito>> eliminarItem(String varianteId) {
        MutableLiveData<RecursoUi<DtoRespuestaCarrito>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.eliminarItemCarrito(varianteId).enqueue(new Callback<DtoRespuestaCarrito>() {
            @Override
            public void onResponse(Call<DtoRespuestaCarrito> call, Response<DtoRespuestaCarrito> r) {
                if (r.isSuccessful() && r.body() != null) {
                    resultado.postValue(RecursoUi.exito(r.body()));
                } else {
                    resultado.postValue(RecursoUi.error("Error al eliminar"));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaCarrito> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }
}
