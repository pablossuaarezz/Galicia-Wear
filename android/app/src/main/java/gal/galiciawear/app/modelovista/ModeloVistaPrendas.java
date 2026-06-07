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

    @Inject
    public ModeloVistaPrendas(RepositorioPrendas repositorio) {
        this.repositorio = repositorio;
    }

    // ── Prendas ───────────────────────────────────────────────────────────────

    public LiveData<RecursoUi<List<DtoRespuestaProducto>>> listarMisPrendas() {
        return repositorio.listarMisPrendas();
    }

    public LiveData<RecursoUi<DtoRespuestaProducto>> obtenerMiPrenda(String id) {
        return repositorio.obtenerMiPrenda(id);
    }

    public LiveData<RecursoUi<DtoRespuestaProducto>> guardarPrenda(
        String id, DtoPeticionProducto cuerpo) {
        return repositorio.guardarPrenda(id, cuerpo);
    }

    public LiveData<RecursoUi<Boolean>> eliminarPrenda(String id) {
        return repositorio.eliminarPrenda(id);
    }

    /** Publica o despublica la prenda (control de visibilidad en el catálogo). */
    public LiveData<RecursoUi<DtoRespuestaProducto>> publicarPrenda(String id, boolean activo) {
        return repositorio.publicarPrenda(id, activo);
    }

    // ── Variantes ──────────────────────────────────────────────────────────────

    public LiveData<RecursoUi<List<DtoVariante>>> listarVariantes(String productoId) {
        return repositorio.listarVariantes(productoId);
    }

    public LiveData<RecursoUi<Boolean>> crearVariante(String productoId, DtoPeticionVariante cuerpo) {
        return repositorio.crearVariante(productoId, cuerpo);
    }

    public LiveData<RecursoUi<Boolean>> eliminarVariante(String productoId, String id) {
        return repositorio.eliminarVariante(productoId, id);
    }

    // ── Fotos (URL en SQL) ──────────────────────────────────────────────────────

    public LiveData<RecursoUi<List<DtoImagen>>> listarImagenes(String productoId) {
        return repositorio.listarImagenes(productoId);
    }

    public LiveData<RecursoUi<Boolean>> crearImagen(String productoId, DtoPeticionImagen cuerpo) {
        return repositorio.crearImagen(productoId, cuerpo);
    }

    public LiveData<RecursoUi<Boolean>> marcarImagenPrincipal(String productoId, String id) {
        return repositorio.marcarImagenPrincipal(productoId, id);
    }

    public LiveData<RecursoUi<Boolean>> eliminarImagen(String productoId, String id) {
        return repositorio.eliminarImagen(productoId, id);
    }
}
