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

    @Inject
    public ModeloVistaDisenador(RepositorioDisenador repositorio) {
        this.repositorio = repositorio;
    }

    public LiveData<RecursoUi<DtoDisenador>> observarPerfil() { return estadoPerfil; }
    public LiveData<RecursoUi<DtoDisenador>> observarGuardado() { return estadoGuardado; }

    public void cargarPerfil() {
        repositorio.obtenerMiPerfil().observeForever(recurso -> {
            if (recurso != null && recurso.esExito()) {
                existePerfil = recurso.datos != null;
            }
            estadoPerfil.postValue(recurso);
        });
    }

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
