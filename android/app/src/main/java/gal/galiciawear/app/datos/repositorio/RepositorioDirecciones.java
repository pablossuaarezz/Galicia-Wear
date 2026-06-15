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

/**
 * Repositorio de direcciones de envío.
 * Encapsula las llamadas Retrofit al backend para listar y crear direcciones
 * de envío del usuario autenticado, siguiendo el patrón Repository de MVVM:
 * el ViewModel ({@link gal.galiciawear.app.modelovista.ModeloVistaDirecciones})
 * solo conoce esta interfaz y no detalles de red.
 */
@Singleton
public class RepositorioDirecciones {

    private final ServicioApi servicioApi;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para los endpoints de direcciones.
     */
    @Inject
    public RepositorioDirecciones(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    /**
     * Obtiene la lista de direcciones de envío guardadas por el usuario.
     *
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         con las direcciones, o {@code error(mensaje)} si falla la petición.
     */
    public MutableLiveData<RecursoUi<List<DtoRespuestaDireccion>>> listarDirecciones() {
        MutableLiveData<RecursoUi<List<DtoRespuestaDireccion>>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.listarDirecciones().enqueue(new Callback<DtoEnvoltorioListaDirecciones>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioListaDirecciones> call,
                                   Response<DtoEnvoltorioListaDirecciones> r) {
                if (r.isSuccessful() && r.body() != null && r.body().direcciones != null) {
                    // postValue: el callback se ejecuta en un hilo de OkHttp, no en el principal.
                    resultado.postValue(RecursoUi.exito(r.body().direcciones));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudieron cargar las direcciones"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioListaDirecciones> call, Throwable t) {
                // Fallo de red (sin conexión, timeout, etc.).
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }

    /**
     * Crea una nueva dirección de envío para el usuario autenticado.
     *
     * @param peticion datos de la nueva dirección (calle, ciudad, código postal, etc.).
     * @return LiveData que emite {@code cargando()} y después {@code exito(direccion)}
     *         con la dirección creada, o {@code error(mensaje)} si falla la petición.
     */
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
