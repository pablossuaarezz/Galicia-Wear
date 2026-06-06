package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioListaPedidos;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@Singleton
public class RepositorioPedidos {

    private final ServicioApi servicioApi;

    @Inject
    public RepositorioPedidos(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaPedido>> crearPedido(
        String direccionId, String metodoPago, boolean envioEcologico
    ) {
        MutableLiveData<RecursoUi<DtoRespuestaPedido>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.crearPedido(new DtoPeticionPedido(direccionId, metodoPago, envioEcologico))
            .enqueue(new Callback<DtoEnvoltorioPedido>() {
                @Override
                public void onResponse(Call<DtoEnvoltorioPedido> call, Response<DtoEnvoltorioPedido> r) {
                    if (r.isSuccessful() && r.body() != null && r.body().pedido != null) {
                        resultado.postValue(RecursoUi.exito(r.body().pedido));
                    } else {
                        resultado.postValue(RecursoUi.error("Error al procesar el pedido"));
                    }
                }

                @Override
                public void onFailure(Call<DtoEnvoltorioPedido> call, Throwable t) {
                    resultado.postValue(RecursoUi.error("Sin conexión"));
                }
            });

        return resultado;
    }

    public MutableLiveData<RecursoUi<List<DtoRespuestaPedido>>> listarPedidos() {
        MutableLiveData<RecursoUi<List<DtoRespuestaPedido>>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.listarPedidos().enqueue(new Callback<DtoEnvoltorioListaPedidos>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioListaPedidos> call,
                                   Response<DtoEnvoltorioListaPedidos> r) {
                if (r.isSuccessful() && r.body() != null && r.body().pedidos != null) {
                    resultado.postValue(RecursoUi.exito(r.body().pedidos));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudieron cargar los pedidos"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioListaPedidos> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaPedido>> obtenerDetalle(String id) {
        MutableLiveData<RecursoUi<DtoRespuestaPedido>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.obtenerPedido(id).enqueue(new Callback<DtoEnvoltorioPedido>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioPedido> call, Response<DtoEnvoltorioPedido> r) {
                if (r.isSuccessful() && r.body() != null && r.body().pedido != null) {
                    resultado.postValue(RecursoUi.exito(r.body().pedido));
                } else {
                    resultado.postValue(RecursoUi.error("Pedido no encontrado"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioPedido> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }
}
