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

/**
 * Repositorio de pedidos.
 * Capa de acceso a datos (patrón Repository) que encapsula las llamadas
 * Retrofit al backend relacionadas con la creación y consulta de pedidos
 * del usuario autenticado. Los ViewModels (p.ej. {@link gal.galiciawear.app.modelovista.ModeloVistaPedidos})
 * consumen estos métodos sin conocer los detalles de red.
 *
 * Todas las operaciones devuelven {@link MutableLiveData} envuelto en
 * {@link RecursoUi} para representar de forma uniforme los estados
 * cargando/éxito/error en la UI.
 */
@Singleton
public class RepositorioPedidos {

    private final ServicioApi servicioApi;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para los endpoints de pedidos.
     */
    @Inject
    public RepositorioPedidos(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    /**
     * Crea un nuevo pedido a partir del carrito actual del usuario.
     *
     * @param direccionId identificador de la dirección de envío seleccionada.
     * @param metodoPago método de pago elegido (p.ej. "tarjeta", "contrareembolso").
     * @param envioEcologico {@code true} si el usuario eligió la opción de envío ecológico.
     * @return LiveData que emite {@code cargando()} y después {@code exito(pedido)}
     *         o {@code error(mensaje)} según el resultado de la petición.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaPedido>> crearPedido(
        String direccionId, String metodoPago, boolean envioEcologico
    ) {
        MutableLiveData<RecursoUi<DtoRespuestaPedido>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        // enqueue() ejecuta la llamada de forma asíncrona en un hilo de OkHttp.
        servicioApi.crearPedido(new DtoPeticionPedido(direccionId, metodoPago, envioEcologico))
            .enqueue(new Callback<DtoEnvoltorioPedido>() {
                @Override
                public void onResponse(Call<DtoEnvoltorioPedido> call, Response<DtoEnvoltorioPedido> r) {
                    if (r.isSuccessful() && r.body() != null && r.body().pedido != null) {
                        // postValue() porque estamos en hilo de background, no en el principal.
                        resultado.postValue(RecursoUi.exito(r.body().pedido));
                    } else {
                        resultado.postValue(RecursoUi.error("Error al procesar el pedido"));
                    }
                }

                @Override
                public void onFailure(Call<DtoEnvoltorioPedido> call, Throwable t) {
                    // Fallo de red (sin conexión, timeout, etc.).
                    resultado.postValue(RecursoUi.error("Sin conexión"));
                }
            });

        return resultado;
    }

    /**
     * Obtiene el listado de pedidos realizados por el usuario autenticado.
     *
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         con la lista de pedidos, o {@code error(mensaje)} si falla la petición.
     */
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

    /**
     * Obtiene el detalle completo de un pedido concreto.
     *
     * @param id identificador del pedido a consultar.
     * @return LiveData que emite {@code cargando()} y después {@code exito(pedido)}
     *         con el detalle del pedido, o {@code error(mensaje)} si no existe
     *         o falla la petición.
     */
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
