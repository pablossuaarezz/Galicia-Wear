package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioPedidos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la pantalla de pedidos.
 * Expone a la UI (Fragments/Activities) tres flujos LiveData independientes:
 * el listado de pedidos del usuario, el detalle de un pedido concreto y el
 * resultado de la creación de un nuevo pedido. Delega toda la lógica de red
 * en {@link RepositorioPedidos}, siguiendo el patrón MVVM: la vista solo
 * observa estos LiveData y nunca llama directamente a Retrofit.
 */
@HiltViewModel
public class ModeloVistaPedidos extends ViewModel {

    private final RepositorioPedidos repositorio;

    // JUSTIFICACIÓN: inicializados eagerly para que los fragmentos puedan suscribirse
    // en onViewCreated() antes de disparar la carga. Si fueran null, observe() petaría.
    private final MutableLiveData<RecursoUi<List<DtoRespuestaPedido>>> estadoLista = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaPedido>> estadoDetalle = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaPedido>> estadoCreacion = new MutableLiveData<>();

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de pedidos usado para las llamadas de red.
     */
    @Inject
    public ModeloVistaPedidos(RepositorioPedidos repositorio) {
        this.repositorio = repositorio;
    }

    /** @return LiveData con el estado del listado de pedidos del usuario. */
    public LiveData<RecursoUi<List<DtoRespuestaPedido>>> observarLista() {
        return estadoLista;
    }

    /** @return LiveData con el estado del detalle del pedido consultado. */
    public LiveData<RecursoUi<DtoRespuestaPedido>> observarDetalle() {
        return estadoDetalle;
    }

    /** @return LiveData con el estado de la creación de un nuevo pedido. */
    public LiveData<RecursoUi<DtoRespuestaPedido>> observarCreacion() {
        return estadoCreacion;
    }

    /**
     * Solicita al repositorio la lista de pedidos del usuario y la publica
     * en {@link #estadoLista}.
     * Usa {@code observeForever} porque el ViewModel no tiene un ciclo de
     * vida de LifecycleOwner propio para observar el LiveData del repositorio;
     * el resultado se reenvía (postValue) al LiveData expuesto a la UI.
     */
    public void cargarMisPedidos() {
        repositorio.listarPedidos()
            .observeForever(valor -> estadoLista.postValue(valor));
    }

    /**
     * Solicita al repositorio el detalle de un pedido concreto y lo publica
     * en {@link #estadoDetalle}.
     *
     * @param id identificador del pedido a consultar.
     */
    public void cargarDetalle(String id) {
        repositorio.obtenerDetalle(id)
            .observeForever(valor -> estadoDetalle.postValue(valor));
    }

    /**
     * Solicita al repositorio la creación de un nuevo pedido y publica el
     * resultado en {@link #estadoCreacion}.
     *
     * @param direccionId identificador de la dirección de envío.
     * @param metodoPago método de pago elegido.
     * @param ecoEnvio {@code true} si se selecciona la opción de envío ecológico.
     */
    public void realizarPedido(String direccionId, String metodoPago, boolean ecoEnvio) {
        repositorio.crearPedido(direccionId, metodoPago, ecoEnvio)
            .observeForever(valor -> estadoCreacion.postValue(valor));
    }
}
