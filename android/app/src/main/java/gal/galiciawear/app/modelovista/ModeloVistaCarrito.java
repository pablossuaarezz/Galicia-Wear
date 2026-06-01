package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioCarrito;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.utilidades.RecursoUi;

@HiltViewModel
public class ModeloVistaCarrito extends ViewModel {

    private final RepositorioCarrito repositorio;

    // JUSTIFICACIÓN: inicializados eagerly para que los fragmentos puedan suscribirse
    // en onViewCreated() antes de disparar la carga. Si fueran null, observe() petaría.
    private final MutableLiveData<RecursoUi<DtoRespuestaCarrito>> estadoCarrito = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaCarrito>> estadoOperacion = new MutableLiveData<>();

    @Inject
    public ModeloVistaCarrito(RepositorioCarrito repositorio) {
        this.repositorio = repositorio;
    }

    public LiveData<Integer> observarContadorItems() {
        return repositorio.observarContadorItems();
    }

    public LiveData<RecursoUi<DtoRespuestaCarrito>> observarCarrito() {
        return estadoCarrito;
    }

    public LiveData<RecursoUi<DtoRespuestaCarrito>> observarOperacion() {
        return estadoOperacion;
    }

    public void cargarCarrito() {
        repositorio.obtenerCarrito()
            .observeForever(valor -> estadoCarrito.postValue(valor));
    }

    public void añadirAlCarrito(String varianteId, int cantidad) {
        repositorio.añadirItem(varianteId, cantidad)
            .observeForever(valor -> estadoOperacion.postValue(valor));
    }

    public void eliminarDelCarrito(String varianteId) {
        repositorio.eliminarItem(varianteId)
            .observeForever(valor -> estadoOperacion.postValue(valor));
    }
}
