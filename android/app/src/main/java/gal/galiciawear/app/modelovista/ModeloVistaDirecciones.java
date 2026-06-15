package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MediatorLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioDirecciones;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaDireccion;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la gestión de direcciones de envío.
 * Usa {@link MediatorLiveData} para poder recargar el listado (por ejemplo,
 * tras crear una nueva dirección) sustituyendo la fuente de datos sin que la
 * UI tenga que volver a suscribirse, y para encadenar la creación de una
 * dirección con la recarga automática del listado.
 */
@HiltViewModel
public class ModeloVistaDirecciones extends ViewModel {

    private final RepositorioDirecciones repositorio;

    // MediatorLiveData para poder recargar la lista (al añadir una dirección
    // nueva) reemplazando la fuente sin que la UI tenga que re-suscribirse.
    private final MediatorLiveData<RecursoUi<List<DtoRespuestaDireccion>>> direcciones = new MediatorLiveData<>();
    private LiveData<RecursoUi<List<DtoRespuestaDireccion>>> fuenteListado;
    private boolean cargada = false;

    private final MediatorLiveData<RecursoUi<DtoRespuestaDireccion>> estadoCreacion = new MediatorLiveData<>();

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de direcciones usado para las llamadas de red.
     */
    @Inject
    public ModeloVistaDirecciones(RepositorioDirecciones repositorio) {
        this.repositorio = repositorio;
    }

    /**
     * Carga las direcciones la primera vez y las mantiene; sobrevive a
     * rotaciones sin relanzar la petición.
     *
     * @return LiveData con el estado del listado de direcciones (cargando/éxito/error).
     */
    public LiveData<RecursoUi<List<DtoRespuestaDireccion>>> obtenerDirecciones() {
        if (!cargada) {
            cargada = true;
            recargar();
        }
        return direcciones;
    }

    /**
     * Vuelve a pedir la lista al backend (p. ej. tras crear una dirección).
     * Si ya había una fuente anterior registrada en el {@link MediatorLiveData},
     * se elimina antes de añadir la nueva, para no acumular fuentes obsoletas.
     */
    public void recargar() {
        if (fuenteListado != null) {
            direcciones.removeSource(fuenteListado);
        }
        fuenteListado = repositorio.listarDirecciones();
        direcciones.addSource(fuenteListado, direcciones::setValue);
    }

    /** @return LiveData con el estado de la creación de una nueva dirección. */
    public LiveData<RecursoUi<DtoRespuestaDireccion>> observarCreacion() {
        return estadoCreacion;
    }

    /**
     * Crea una dirección; al tener éxito refresca la lista automáticamente.
     * Internamente añade la llamada del repositorio como fuente temporal del
     * {@link MediatorLiveData} {@code estadoCreacion}; en cuanto se recibe un
     * resultado definitivo (éxito o error, no "cargando") se retira la fuente
     * para no seguir escuchando esa llamada ya completada.
     *
     * @param peticion datos de la nueva dirección.
     */
    public void crearDireccion(DtoPeticionDireccion peticion) {
        LiveData<RecursoUi<DtoRespuestaDireccion>> fuente = repositorio.crearDireccion(peticion);
        estadoCreacion.addSource(fuente, recurso -> {
            estadoCreacion.setValue(recurso);
            if (recurso == null) return;
            if (recurso.esExito()) {
                estadoCreacion.removeSource(fuente);
                recargar();
            } else if (recurso.esError()) {
                estadoCreacion.removeSource(fuente);
            }
        });
    }
}
