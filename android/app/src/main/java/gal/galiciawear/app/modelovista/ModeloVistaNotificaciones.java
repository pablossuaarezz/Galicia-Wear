package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoNotificacion;
import gal.galiciawear.app.datos.repositorio.RepositorioChat;
import gal.galiciawear.app.datos.repositorio.RepositorioNotificaciones;
import gal.galiciawear.app.utilidades.RecursoUi;

/**
 * ViewModel de la bandeja de notificaciones. Combina:
 *   - REST ({@link RepositorioNotificaciones}): historial, contador y marcado de leídas.
 *   - Tiempo real ({@link RepositorioChat}): el LiveData "nuevaNotificacion" que emite el
 *     mismo socket autenticado cuando llega un evento mientras la app está abierta.
 */
@HiltViewModel
public class ModeloVistaNotificaciones extends ViewModel {

    private final RepositorioNotificaciones repositorio;
    private final RepositorioChat repositorioChat;

    @Inject
    public ModeloVistaNotificaciones(RepositorioNotificaciones repositorio,
                                     RepositorioChat repositorioChat) {
        this.repositorio = repositorio;
        this.repositorioChat = repositorioChat;
    }

    public LiveData<RecursoUi<List<DtoNotificacion>>> listar() {
        return repositorio.listar();
    }

    public LiveData<Integer> contador() {
        return repositorio.contador();
    }

    public void marcarLeida(String id) {
        repositorio.marcarLeida(id);
    }

    public LiveData<Boolean> marcarTodasLeidas() {
        return repositorio.marcarTodasLeidas();
    }

    /** LiveData de notificaciones que llegan por socket (para refrescar lista/badge en vivo). */
    public LiveData<DtoNotificacion> nuevaNotificacion() {
        return repositorioChat.nuevaNotificacion;
    }

    /**
     * Asegura que el socket está conectado para recibir notificaciones en tiempo real aunque
     * el usuario no haya abierto el chat. Reutiliza la conexión si ya existe (mismo usuario).
     */
    public void conectarTiempoReal() {
        repositorioChat.conectar();
    }

    /** Registra el token FCM del dispositivo (best-effort). */
    public void registrarTokenFcm(String token) {
        repositorio.registrarTokenFcm(token);
    }
}
