package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.datos.repositorio.RepositorioAutenticacion;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;

@HiltViewModel
public class ModeloVistaPerfil extends ViewModel {

    private final RepositorioAutenticacion repositorio;
    private final GestorSesion gestorSesion;

    private final MutableLiveData<RecursoUi<DtoRespuestaUsuario>> estadoPerfil = new MutableLiveData<>();
    private final MutableLiveData<Boolean> cerroSesion = new MutableLiveData<>(false);

    @Inject
    public ModeloVistaPerfil(RepositorioAutenticacion repositorio, GestorSesion gestorSesion) {
        this.repositorio  = repositorio;
        this.gestorSesion = gestorSesion;
    }

    public LiveData<RecursoUi<DtoRespuestaUsuario>> observarPerfil() {
        return estadoPerfil;
    }

    public LiveData<Boolean> observarCierreSesion() {
        return cerroSesion;
    }

    public void cargarPerfil() {
        repositorio.obtenerPerfil().observeForever(v -> estadoPerfil.postValue(v));
    }

    public void cerrarSesion() {
        repositorio.cerrarSesion();
        cerroSesion.setValue(true);
    }

    public String obtenerNombreUsuario() {
        return gestorSesion.obtenerUsuarioNombre();
    }

    public String obtenerRolUsuario() {
        return gestorSesion.obtenerUsuarioRol();
    }
}
