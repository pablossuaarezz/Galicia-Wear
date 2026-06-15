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

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de carrito (fuente única de verdad del estado).
     */
    @Inject
    public ModeloVistaCarrito(RepositorioCarrito repositorio) {
        this.repositorio = repositorio;
    }

    /** @return LiveData con el número de unidades en el carrito, para el badge. */
    public LiveData<Integer> observarContadorItems() {
        return repositorio.observarContadorItems();
    }

    /** @return LiveData con el estado compartido del carrito (cargando/éxito/error). */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> observarCarrito() {
        return repositorio.observarCarrito();
    }

    /** Solicita al repositorio la carga (o recarga) del carrito desde el backend. */
    public void cargarCarrito() {
        repositorio.cargarCarrito();
    }

    /**
     * Añade un artículo al carrito (o fija su cantidad, ya que el backend hace upsert).
     *
     * @param varianteId identificador de la variante (talla/color) del producto.
     * @param cantidad cantidad a añadir/fijar.
     * @return LiveData de un solo uso con el resultado de la operación.
     */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> añadirAlCarrito(String varianteId, int cantidad) {
        return repositorio.añadirItem(varianteId, cantidad);
    }

    /**
     * Fija la cantidad absoluta de una línea (el backend hace upsert por variante).
     *
     * @param varianteId identificador de la variante.
     * @param cantidad nueva cantidad absoluta para esa variante.
     * @return LiveData de un solo uso con el resultado de la operación.
     */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> actualizarCantidad(String varianteId, int cantidad) {
        return repositorio.añadirItem(varianteId, cantidad);
    }

    /**
     * Elimina un artículo del carrito.
     *
     * @param varianteId identificador de la variante a eliminar.
     * @return LiveData de un solo uso con el resultado de la operación.
     */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> eliminarDelCarrito(String varianteId) {
        return repositorio.eliminarItem(varianteId);
    }

    /** El pedido se ha creado: el backend ya vació el carrito, lo reflejamos en local. */
    public void vaciarTrasPedido() {
        repositorio.vaciarTrasPedido();
    }
}
