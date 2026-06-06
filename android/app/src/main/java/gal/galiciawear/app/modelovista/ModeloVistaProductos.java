package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModel;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.local.entidad.EntidadProducto;
import gal.galiciawear.app.datos.repositorio.RepositorioProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.utilidades.Constantes;
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
    // Estado dedicado del buscador: encapsula si lo mostrado son coincidencias
    // exactas o productos similares (fallback cuando no hay resultados).
    private final MutableLiveData<RecursoUi<ResultadoBusqueda>> estadoBusqueda = new MutableLiveData<>();

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

    // ── Buscador de texto libre ───────────────────────────────────────────────

    public LiveData<RecursoUi<ResultadoBusqueda>> observarBusqueda() {
        return estadoBusqueda;
    }

    /**
     * Busca por texto libre (ej. "camiseta"). Si la consulta no devuelve
     * coincidencias exactas, carga el catálogo completo y propone los
     * productos más parecidos como sugerencia, en lugar de dejar la
     * pantalla vacía (criterio "evitar callejones sin salida").
     */
    public void buscar(String consulta) {
        final String q = consulta == null ? "" : consulta.trim();
        estadoBusqueda.setValue(RecursoUi.cargando());
        cargarUnaVez(
            repositorio.cargarProductos(q.isEmpty() ? null : q, null, null, null, null, 1),
            recurso -> {
                if (!recurso.esExito()) {
                    estadoBusqueda.postValue(RecursoUi.error(recurso.mensaje));
                    return;
                }
                List<DtoRespuestaProducto> lista =
                    recurso.datos != null ? recurso.datos : new ArrayList<>();
                if (lista.isEmpty()) {
                    cargarSimilares(q);
                } else {
                    estadoBusqueda.postValue(
                        RecursoUi.exito(new ResultadoBusqueda(lista, false, q)));
                }
            });
    }

    /** Carga el catálogo completo y lo ordena por parecido a la consulta. */
    private void cargarSimilares(String consulta) {
        cargarUnaVez(
            repositorio.cargarProductos(null, null, null, null, null, 1),
            recurso -> {
                if (!recurso.esExito()) {
                    estadoBusqueda.postValue(RecursoUi.error(recurso.mensaje));
                    return;
                }
                List<DtoRespuestaProducto> todos =
                    recurso.datos != null ? recurso.datos : new ArrayList<>();
                estadoBusqueda.postValue(RecursoUi.exito(
                    new ResultadoBusqueda(rankearSimilares(consulta, todos), true, consulta)));
            });
    }

    /**
     * Observa un LiveData de un solo uso (el repositorio crea uno nuevo por
     * petición): espera al primer estado terminal, se desuscribe y entrega
     * el resultado. Evita acumular observadores en cada búsqueda.
     */
    private <T> void cargarUnaVez(LiveData<RecursoUi<T>> origen, Consumidor<RecursoUi<T>> alTerminar) {
        origen.observeForever(new Observer<RecursoUi<T>>() {
            @Override
            public void onChanged(RecursoUi<T> valor) {
                if (valor == null || valor.estaCargando()) return;
                origen.removeObserver(this);
                alTerminar.aceptar(valor);
            }
        });
    }

    /**
     * Ordena los productos por relevancia respecto a la consulta y devuelve
     * los mejores. Se pondera nombre &gt; material &gt; marca &gt; descripción.
     */
    private List<DtoRespuestaProducto> rankearSimilares(
            String consulta, List<DtoRespuestaProducto> todos) {
        String[] tokens = normalizar(consulta).split("\\s+");

        List<DtoRespuestaProducto> ordenados = new ArrayList<>(todos);
        Collections.sort(ordenados, (a, b) ->
            puntuar(b, tokens) - puntuar(a, tokens));

        if (ordenados.size() > Constantes.MAX_PRODUCTOS_SIMILARES) {
            return new ArrayList<>(ordenados.subList(0, Constantes.MAX_PRODUCTOS_SIMILARES));
        }
        return ordenados;
    }

    private int puntuar(DtoRespuestaProducto p, String[] tokens) {
        String nombre   = normalizar(p.nombre);
        String material = normalizar(p.materialPrincipal);
        String marca    = p.disenador != null ? normalizar(p.disenador.nombreMarca) : "";
        String desc     = normalizar(p.descripcion);
        int score = 0;
        for (String t : tokens) {
            if (t.isEmpty()) continue;
            if (nombre.contains(t))   score += 5;
            if (material.contains(t)) score += 3;
            if (marca.contains(t))    score += 2;
            if (desc.contains(t))     score += 1;
        }
        return score;
    }

    /** Minúsculas y sin tildes, para comparar de forma tolerante a acentos. */
    private static String normalizar(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return n.toLowerCase().trim();
    }

    // ── Tipos auxiliares del buscador ─────────────────────────────────────────

    /** Resultado del buscador: la lista y si son coincidencias exactas o similares. */
    public static class ResultadoBusqueda {
        public final List<DtoRespuestaProducto> productos;
        public final boolean sonSimilares;
        public final String consulta;

        public ResultadoBusqueda(List<DtoRespuestaProducto> productos,
                                  boolean sonSimilares, String consulta) {
            this.productos    = productos;
            this.sonSimilares = sonSimilares;
            this.consulta     = consulta;
        }
    }

    /** Callback de un solo argumento (evita depender de java.util.function). */
    private interface Consumidor<T> {
        void aceptar(T valor);
    }
}
