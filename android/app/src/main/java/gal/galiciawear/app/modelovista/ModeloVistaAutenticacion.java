package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioAutenticacion;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de autenticación.
 *
 * JUSTIFICACIÓN de @HiltViewModel: Hilt crea la instancia e inyecta el
 * repositorio. El ViewModel sobrevive a las rotaciones de pantalla, por lo
 * que el estado de carga no se pierde al girar el dispositivo.
 */
@HiltViewModel
public class ModeloVistaAutenticacion extends ViewModel {

    private final RepositorioAutenticacion repositorio;

    // Estado de cada operación expuesto como LiveData (inmutable para la UI).
    // JUSTIFICACIÓN: se inicializan eagerly para que la UI pueda suscribirse
    // en onViewCreated() ANTES de disparar la operación. Si fueran null hasta
    // la primera llamada a iniciarSesion(), observe() petaría con NPE.
    private final MutableLiveData<RecursoUi<DtoRespuestaToken>> estadoLogin = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaToken>> estadoRegistro = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaUsuario>> estadoPerfil = new MutableLiveData<>();

    @Inject
    public ModeloVistaAutenticacion(RepositorioAutenticacion repositorio) {
        this.repositorio = repositorio;
    }

    // ── Acceso desde la UI ───────────────────────────────────────────────────

    public LiveData<RecursoUi<DtoRespuestaToken>> observarLogin() {
        return estadoLogin;
    }

    public LiveData<RecursoUi<DtoRespuestaToken>> observarRegistro() {
        return estadoRegistro;
    }

    public LiveData<RecursoUi<DtoRespuestaUsuario>> observarPerfil() {
        return estadoPerfil;
    }

    // ── Acciones ─────────────────────────────────────────────────────────────

    public void iniciarSesion(String correo, String contrasena) {
        // Reemitimos a través del LiveData propio para no romper a los observadores
        // que ya se hubieran suscrito a estadoLogin antes de iniciar la operación.
        repositorio.login(correo, contrasena)
            .observeForever(valor -> estadoLogin.postValue(valor));
    }

    public void registrarse(String correo, String contrasena,
                             String nombre, String apellidos, String rol) {
        repositorio.registro(correo, contrasena, nombre, apellidos, rol)
            .observeForever(valor -> estadoRegistro.postValue(valor));
    }

    public void cargarPerfil() {
        repositorio.obtenerPerfil().observeForever(v -> estadoPerfil.postValue(v));
    }

    public void cerrarSesion() {
        repositorio.cerrarSesion();
    }

    // ── Consultas de estado ──────────────────────────────────────────────────

    public boolean hayTokenAcceso()        { return repositorio.hayTokenAcceso(); }
    public boolean onboardingYaVisto()     { return repositorio.onboardingYaVisto(); }
    public void marcarOnboardingVisto()    { repositorio.marcarOnboardingVisto(); }
}
