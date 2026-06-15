package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionActualizarPerfil;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.datos.repositorio.RepositorioAutenticacion;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la pantalla de perfil de usuario.
 * Coordina la carga y actualización del perfil (vía {@link RepositorioAutenticacion})
 * y expone datos de sesión leídos localmente ({@link GestorSesion}), además de
 * gestionar el cierre de sesión. La UI observa los LiveData expuestos y nunca
 * accede directamente al repositorio ni al gestor de sesión.
 */
@HiltViewModel
public class ModeloVistaPerfil extends ViewModel {

    private final RepositorioAutenticacion repositorio;
    private final GestorSesion gestorSesion;

    private final MutableLiveData<RecursoUi<DtoRespuestaUsuario>> estadoPerfil = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<Void>> estadoActualizacion = new MutableLiveData<>();
    private final MutableLiveData<Boolean> cerroSesion = new MutableLiveData<>(false);

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio de autenticación usado para cargar/actualizar
     *                     el perfil y cerrar sesión.
     * @param gestorSesion fuente de datos de sesión persistidos localmente
     *                      (nombre y rol del usuario).
     */
    @Inject
    public ModeloVistaPerfil(RepositorioAutenticacion repositorio, GestorSesion gestorSesion) {
        this.repositorio  = repositorio;
        this.gestorSesion = gestorSesion;
    }

    /** @return LiveData con el estado de la carga del perfil del usuario. */
    public LiveData<RecursoUi<DtoRespuestaUsuario>> observarPerfil() {
        return estadoPerfil;
    }

    /** @return LiveData con el estado de la actualización del perfil. */
    public LiveData<RecursoUi<Void>> observarActualizacion() {
        return estadoActualizacion;
    }

    /** @return LiveData que se pone a {@code true} cuando el usuario cierra sesión. */
    public LiveData<Boolean> observarCierreSesion() {
        return cerroSesion;
    }

    /**
     * Solicita al repositorio los datos completos del perfil del usuario
     * autenticado y los publica en {@link #estadoPerfil}.
     */
    public void cargarPerfil() {
        repositorio.obtenerPerfil().observeForever(v -> estadoPerfil.postValue(v));
    }

    /**
     * Actualiza el perfil del cliente (campos editados y/o avatar).
     *
     * @param cuerpo datos del perfil a actualizar (nombre, apellidos, teléfono, avatar...).
     */
    public void actualizarPerfil(DtoPeticionActualizarPerfil cuerpo) {
        repositorio.actualizarPerfil(cuerpo).observeForever(v -> estadoActualizacion.postValue(v));
    }

    /**
     * Cierra la sesión del usuario delegando en el repositorio (que invalida
     * el token, desconecta el chat y borra los datos locales) y notifica a
     * la UI a través de {@link #cerroSesion} para que navegue a la pantalla de login.
     */
    public void cerrarSesion() {
        repositorio.cerrarSesion();
        cerroSesion.setValue(true);
    }

    /** @return el nombre del usuario autenticado, leído de la sesión local. */
    public String obtenerNombreUsuario() {
        return gestorSesion.obtenerUsuarioNombre();
    }

    /** @return el rol del usuario autenticado, leído de la sesión local. */
    public String obtenerRolUsuario() {
        return gestorSesion.obtenerUsuarioRol();
    }
}
