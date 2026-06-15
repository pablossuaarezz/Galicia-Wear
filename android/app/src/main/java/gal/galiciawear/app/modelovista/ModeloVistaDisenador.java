package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.datos.repositorio.RepositorioDisenador;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel del perfil de diseñador. Al abrir la pantalla carga el perfil propio
 * (si existe) y, al guardar, decide entre alta (POST /solicitar) o edición
 * (PATCH /yo) según hubiera o no perfil previo.
 */
@HiltViewModel
public class ModeloVistaDisenador extends ViewModel {

    private final RepositorioDisenador repositorio;

    private final MutableLiveData<RecursoUi<DtoDisenador>> estadoPerfil = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoDisenador>> estadoGuardado = new MutableLiveData<>();

    // ¿Existe ya perfil? Determina si guardar es alta o actualización.
    private boolean existePerfil = false;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de diseñador usado para las llamadas de red.
     */
    @Inject
    public ModeloVistaDisenador(RepositorioDisenador repositorio) {
        this.repositorio = repositorio;
    }

    /** @return LiveData con el estado de la carga del perfil de diseñador. */
    public LiveData<RecursoUi<DtoDisenador>> observarPerfil() { return estadoPerfil; }

    /** @return LiveData con el estado del guardado (alta o actualización) del perfil. */
    public LiveData<RecursoUi<DtoDisenador>> observarGuardado() { return estadoGuardado; }

    /**
     * Solicita al repositorio el perfil de diseñador del usuario actual.
     * Si la respuesta es exitosa, actualiza el flag {@code existePerfil} según
     * si el backend devolvió datos (perfil ya creado) o no (sin perfil aún),
     * de forma que {@link #guardar(DtoPeticionDisenador)} sepa si debe hacer
     * alta o edición. El resultado se reenvía a {@link #estadoPerfil}.
     */
    public void cargarPerfil() {
        repositorio.obtenerMiPerfil().observeForever(recurso -> {
            if (recurso != null && recurso.esExito()) {
                existePerfil = recurso.datos != null;
            }
            estadoPerfil.postValue(recurso);
        });
    }

    /**
     * Guarda el perfil de diseñador, decidiendo entre alta (POST) o edición
     * (PATCH) en función de {@code existePerfil}. Tras un guardado exitoso,
     * marca {@code existePerfil = true} para que futuras llamadas usen edición.
     *
     * @param cuerpo datos del perfil de diseñador a guardar.
     */
    public void guardar(DtoPeticionDisenador cuerpo) {
        repositorio.guardarPerfil(cuerpo, !existePerfil)
            .observeForever(recurso -> {
                if (recurso != null && recurso.esExito()) {
                    existePerfil = true;
                }
                estadoGuardado.postValue(recurso);
            });
    }
}
