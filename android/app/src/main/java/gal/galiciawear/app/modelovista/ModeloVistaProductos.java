package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.local.entidad.EntidadProducto;
import gal.galiciawear.app.datos.repositorio.RepositorioProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de productos.
 * Gestiona el estado de los filtros y la paginación para que
 * no se pierdan al rotar el dispositivo (Ley de Hick: los filtros
 * aplicados deben mantenerse visibles sin que el usuario los repita).
 */
@HiltViewModel
public class ModeloVistaProductos extends ViewModel {

    private final RepositorioProductos repositorio;

    // Estado expuesto a la UI.
    // JUSTIFICACIÓN: inicializados eagerly para que los fragmentos puedan suscribirse
    // en onViewCreated() antes de disparar la carga. Si fueran null, observe() petaría.
    private final MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> estadoProductos = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaProducto>> estadoDetalle = new MutableLiveData<>();

    // Filtros actuales — se conservan al rotar
    private String filtroBusqueda    = null;
    private String filtroMaterial    = null;
    private String filtroCiudad      = null;
    private Integer filtroMaxKm      = null;
    private String filtroCertificado = null;
    private int paginaActual         = 1;

    @Inject
    public ModeloVistaProductos(RepositorioProductos repositorio) {
        this.repositorio = repositorio;
    }

    // ── Caché offline ────────────────────────────────────────────────────────

    /** Datos del caché Room — disponibles offline inmediatamente */
    public LiveData<List<EntidadProducto>> observarCache() {
        return repositorio.observarProductosCache();
    }

    // ── Red ──────────────────────────────────────────────────────────────────

    public LiveData<RecursoUi<List<DtoRespuestaProducto>>> observarProductos() {
        return estadoProductos;
    }

    public LiveData<RecursoUi<DtoRespuestaProducto>> observarDetalle() {
        return estadoDetalle;
    }

    public void cargarProductos() {
        // Re-emitimos a través del LiveData propio para no perder a los observadores
        // que ya se hubieran suscrito antes de iniciar la carga.
        repositorio.cargarProductos(
            filtroBusqueda, filtroMaterial, filtroCiudad,
            filtroMaxKm, filtroCertificado, paginaActual
        ).observeForever(valor -> estadoProductos.postValue(valor));
    }

    public void cargarDetalle(String slug) {
        repositorio.obtenerDetalle(slug)
            .observeForever(valor -> estadoDetalle.postValue(valor));
    }

    // ── Filtros ──────────────────────────────────────────────────────────────

    public void aplicarFiltros(String busqueda, String material, String ciudad,
                                Integer maxKm, String certificado) {
        this.filtroBusqueda    = busqueda.isEmpty()    ? null : busqueda;
        this.filtroMaterial    = material.isEmpty()    ? null : material;
        this.filtroCiudad      = ciudad.isEmpty()      ? null : ciudad;
        this.filtroMaxKm       = maxKm;
        this.filtroCertificado = certificado.isEmpty() ? null : certificado;
        this.paginaActual      = 1;
        cargarProductos();
    }

    public void limpiarFiltros() {
        filtroBusqueda = filtroMaterial = filtroCiudad = filtroCertificado = null;
        filtroMaxKm = null;
        paginaActual = 1;
        cargarProductos();
    }

    // Getters de filtros actuales (para restaurar la UI)
    public String getFiltroBusqueda()    { return filtroBusqueda != null    ? filtroBusqueda    : ""; }
    public String getFiltroMaterial()    { return filtroMaterial != null    ? filtroMaterial    : ""; }
    public String getFiltroMaxKm()       { return filtroMaxKm != null       ? String.valueOf(filtroMaxKm) : ""; }
    public String getFiltroCertificado() { return filtroCertificado != null ? filtroCertificado : ""; }
}
