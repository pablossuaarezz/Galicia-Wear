package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionVariante;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoVariante;
import gal.galiciawear.app.datos.repositorio.RepositorioPrendas;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la gestión de prendas del diseñador. Expone las operaciones del
 * repositorio (catálogo propio, alta/edición de prenda, variantes y fotos por URL)
 * como LiveData observables por las actividades.
 */
@HiltViewModel
public class ModeloVistaPrendas extends ViewModel {

    private final RepositorioPrendas repositorio;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de prendas del diseñador usado para las llamadas de red.
     */
    @Inject
    public ModeloVistaPrendas(RepositorioPrendas repositorio) {
        this.repositorio = repositorio;
    }

    // ── Prendas ───────────────────────────────────────────────────────────────

    /** @return LiveData con el estado del catálogo de prendas propio del diseñador. */
    public LiveData<RecursoUi<List<DtoRespuestaProducto>>> listarMisPrendas() {
        return repositorio.listarMisPrendas();
    }

    /**
     * @param id identificador de la prenda.
     * @return LiveData con el estado del detalle de la prenda.
     */
    public LiveData<RecursoUi<DtoRespuestaProducto>> obtenerMiPrenda(String id) {
        return repositorio.obtenerMiPrenda(id);
    }

    /**
     * Crea o actualiza una prenda según si se proporciona un identificador.
     *
     * @param id identificador de la prenda a actualizar, o {@code null} para crear una nueva.
     * @param cuerpo datos de la prenda.
     * @return LiveData con el estado del guardado.
     */
    public LiveData<RecursoUi<DtoRespuestaProducto>> guardarPrenda(
        String id, DtoPeticionProducto cuerpo) {
        return repositorio.guardarPrenda(id, cuerpo);
    }

    /**
     * @param id identificador de la prenda a eliminar.
     * @return LiveData con el resultado de la eliminación.
     */
    public LiveData<RecursoUi<Boolean>> eliminarPrenda(String id) {
        return repositorio.eliminarPrenda(id);
    }

    /**
     * Publica o despublica la prenda (control de visibilidad en el catálogo).
     *
     * @param id identificador de la prenda.
     * @param activo {@code true} para publicarla, {@code false} para ocultarla.
     * @return LiveData con el estado de la operación.
     */
    public LiveData<RecursoUi<DtoRespuestaProducto>> publicarPrenda(String id, boolean activo) {
        return repositorio.publicarPrenda(id, activo);
    }

    // ── Variantes ──────────────────────────────────────────────────────────────

    /**
     * @param productoId identificador de la prenda.
     * @return LiveData con el estado de la lista de variantes (talla/color/stock).
     */
    public LiveData<RecursoUi<List<DtoVariante>>> listarVariantes(String productoId) {
        return repositorio.listarVariantes(productoId);
    }

    /**
     * @param productoId identificador de la prenda.
     * @param cuerpo datos de la nueva variante.
     * @return LiveData con el resultado de la creación.
     */
    public LiveData<RecursoUi<Boolean>> crearVariante(String productoId, DtoPeticionVariante cuerpo) {
        return repositorio.crearVariante(productoId, cuerpo);
    }

    /**
     * @param productoId identificador de la prenda.
     * @param id identificador de la variante a eliminar.
     * @return LiveData con el resultado de la eliminación.
     */
    public LiveData<RecursoUi<Boolean>> eliminarVariante(String productoId, String id) {
        return repositorio.eliminarVariante(productoId, id);
    }

    // ── Fotos (URL en SQL) ──────────────────────────────────────────────────────

    /**
     * @param productoId identificador de la prenda.
     * @return LiveData con el estado de la lista de imágenes de la prenda.
     */
    public LiveData<RecursoUi<List<DtoImagen>>> listarImagenes(String productoId) {
        return repositorio.listarImagenes(productoId);
    }

    /**
     * @param productoId identificador de la prenda.
     * @param cuerpo datos de la imagen a añadir (URL, principal).
     * @return LiveData con el resultado de la creación.
     */
    public LiveData<RecursoUi<Boolean>> crearImagen(String productoId, DtoPeticionImagen cuerpo) {
        return repositorio.crearImagen(productoId, cuerpo);
    }

    /**
     * @param productoId identificador de la prenda.
     * @param id identificador de la imagen a marcar como principal.
     * @return LiveData con el resultado de la operación.
     */
    public LiveData<RecursoUi<Boolean>> marcarImagenPrincipal(String productoId, String id) {
        return repositorio.marcarImagenPrincipal(productoId, id);
    }

    /**
     * @param productoId identificador de la prenda.
     * @param id identificador de la imagen a eliminar.
     * @return LiveData con el resultado de la eliminación.
     */
    public LiveData<RecursoUi<Boolean>> eliminarImagen(String productoId, String id) {
        return repositorio.eliminarImagen(productoId, id);
    }
}
