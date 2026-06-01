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

@HiltViewModel
public class ModeloVistaPedidos extends ViewModel {

    private final RepositorioPedidos repositorio;

    // JUSTIFICACIÓN: inicializados eagerly para que los fragmentos puedan suscribirse
    // en onViewCreated() antes de disparar la carga. Si fueran null, observe() petaría.
    private final MutableLiveData<RecursoUi<List<DtoRespuestaPedido>>> estadoLista = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaPedido>> estadoDetalle = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaPedido>> estadoCreacion = new MutableLiveData<>();

    @Inject
    public ModeloVistaPedidos(RepositorioPedidos repositorio) {
        this.repositorio = repositorio;
    }

    public LiveData<RecursoUi<List<DtoRespuestaPedido>>> observarLista() {
        return estadoLista;
    }

    public LiveData<RecursoUi<DtoRespuestaPedido>> observarDetalle() {
        return estadoDetalle;
    }

    public LiveData<RecursoUi<DtoRespuestaPedido>> observarCreacion() {
        return estadoCreacion;
    }

    public void cargarMisPedidos() {
        repositorio.listarPedidos()
            .observeForever(valor -> estadoLista.postValue(valor));
    }

    public void cargarDetalle(String id) {
        repositorio.obtenerDetalle(id)
            .observeForever(valor -> estadoDetalle.postValue(valor));
    }

    public void realizarPedido(String direccionId, String metodoPago, boolean ecoEnvio) {
        repositorio.crearPedido(direccionId, metodoPago, ecoEnvio)
            .observeForever(valor -> estadoCreacion.postValue(valor));
    }
}
