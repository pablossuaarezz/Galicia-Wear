package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioCarrito;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel del carrito.
 *
 * Delega en el repositorio (fuente única de verdad) y expone su estado tal cual.
 * Las operaciones de añadir/eliminar devuelven un LiveData de un solo uso que la
 * pantalla observa con su propio ciclo de vida — así evitamos los observeForever()
 * sin retirar que filtraban observadores en la versión anterior.
 */
@HiltViewModel
public class ModeloVistaCarrito extends ViewModel {

    private final RepositorioCarrito repositorio;

    @Inject
    public ModeloVistaCarrito(RepositorioCarrito repositorio) {
        this.repositorio = repositorio;
    }

    public LiveData<Integer> observarContadorItems() {
        return repositorio.observarContadorItems();
    }

    public LiveData<RecursoUi<DtoRespuestaCarrito>> observarCarrito() {
        return repositorio.observarCarrito();
    }

    public void cargarCarrito() {
        repositorio.cargarCarrito();
    }

    public LiveData<RecursoUi<DtoRespuestaCarrito>> añadirAlCarrito(String varianteId, int cantidad) {
        return repositorio.añadirItem(varianteId, cantidad);
    }

    /** Fija la cantidad absoluta de una línea (el backend hace upsert por variante). */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> actualizarCantidad(String varianteId, int cantidad) {
        return repositorio.añadirItem(varianteId, cantidad);
    }

    public LiveData<RecursoUi<DtoRespuestaCarrito>> eliminarDelCarrito(String varianteId) {
        return repositorio.eliminarItem(varianteId);
    }

    /** El pedido se ha creado: el backend ya vació el carrito, lo reflejamos en local. */
    public void vaciarTrasPedido() {
        repositorio.vaciarTrasPedido();
    }
}
