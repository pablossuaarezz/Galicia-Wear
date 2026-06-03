package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.repositorio.RepositorioAutenticacion;
import gal.galiciawear.app.datos.repositorio.RepositorioDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.utilidades.Constantes;
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
    private final RepositorioDisenador repositorioDisenador;

    // Estado de cada operación expuesto como LiveData (inmutable para la UI).
    // JUSTIFICACIÓN: se inicializan eagerly para que la UI pueda suscribirse
    // en onViewCreated() ANTES de disparar la operación. Si fueran null hasta
    // la primera llamada a iniciarSesion(), observe() petaría con NPE.
    private final MutableLiveData<RecursoUi<DtoRespuestaToken>> estadoLogin = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaToken>> estadoRegistro = new MutableLiveData<>();
    private final MutableLiveData<RecursoUi<DtoRespuestaUsuario>> estadoPerfil = new MutableLiveData<>();
    // Alta de diseñador: encadena registro de cuenta + creación del perfil de negocio.
    private final MutableLiveData<RecursoUi<DtoDisenador>> estadoRegistroDisenador = new MutableLiveData<>();

    @Inject
    public ModeloVistaAutenticacion(RepositorioAutenticacion repositorio,
                                    RepositorioDisenador repositorioDisenador) {
        this.repositorio = repositorio;
        this.repositorioDisenador = repositorioDisenador;
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

    public LiveData<RecursoUi<DtoDisenador>> observarRegistroDisenador() {
        return estadoRegistroDisenador;
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

    /**
     * Alta completa de diseñador en un solo paso: primero crea la cuenta (rol
     * DISENADOR) y, en cuanto hay token, crea el perfil de negocio con los datos
     * de la marca. El estado combinado se publica en estadoRegistroDisenador.
     */
    public void registrarComoDisenador(String correo, String contrasena,
                                        DtoPeticionDisenador datosNegocio) {
        estadoRegistroDisenador.setValue(RecursoUi.cargando());
        repositorio.registro(correo, contrasena, "", "", Constantes.ROL_DISENADOR)
            .observeForever(reg -> {
                if (reg == null || reg.estaCargando()) return;
                if (reg.esError()) {
                    estadoRegistroDisenador.postValue(RecursoUi.error(reg.mensaje));
                    return;
                }
                // Cuenta creada y token guardado: ya podemos crear el perfil de marca.
                repositorioDisenador.guardarPerfil(datosNegocio, true)
                    .observeForever(perfil -> {
                        if (perfil == null || perfil.estaCargando()) return;
                        estadoRegistroDisenador.postValue(perfil);
                    });
            });
    }

    public void cargarPerfil() {
        repositorio.obtenerPerfil().observeForever(v -> estadoPerfil.postValue(v));
    }

    public void cerrarSesion() {
        repositorio.cerrarSesion();
    }

    /**
     * Comprueba si el diseñador autenticado ya está validado. EXITO con
     * datos=true → validado; datos=false → pendiente (o aún sin perfil).
     */
    public LiveData<RecursoUi<Boolean>> estaValidadoComoDisenador() {
        MutableLiveData<RecursoUi<Boolean>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());
        repositorioDisenador.obtenerMiPerfil().observeForever(recurso -> {
            if (recurso == null || recurso.estaCargando()) return;
            if (recurso.esExito()) {
                boolean validado = recurso.datos != null && recurso.datos.validado;
                resultado.postValue(RecursoUi.exito(validado));
            } else {
                resultado.postValue(RecursoUi.error(recurso.mensaje));
            }
        });
        return resultado;
    }

    // ── Consultas de estado ──────────────────────────────────────────────────

    public boolean hayTokenAcceso()        { return repositorio.hayTokenAcceso(); }
    public String obtenerRol()             { return repositorio.obtenerRol(); }
    public boolean onboardingYaVisto()     { return repositorio.onboardingYaVisto(); }
    public void marcarOnboardingVisto()    { repositorio.marcarOnboardingVisto(); }
}
