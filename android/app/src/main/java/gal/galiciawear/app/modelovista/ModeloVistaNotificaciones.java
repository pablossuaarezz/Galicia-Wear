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

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorio repositorio REST de notificaciones (historial, contador, marcado).
     * @param repositorioChat repositorio del socket de chat, que también emite
     *                         notificaciones en tiempo real.
     */
    @Inject
    public ModeloVistaNotificaciones(RepositorioNotificaciones repositorio,
                                     RepositorioChat repositorioChat) {
        this.repositorio = repositorio;
        this.repositorioChat = repositorioChat;
    }

    /**
     * Obtiene el historial de notificaciones del usuario (primera página).
     *
     * @return LiveData con el estado (cargando/éxito/error) de la lista de notificaciones.
     */
    public LiveData<RecursoUi<List<DtoNotificacion>>> listar() {
        return repositorio.listar();
    }

    /**
     * Obtiene el número de notificaciones no leídas para el badge.
     *
     * @return LiveData con el contador (0 si hay error, para ocultar el badge).
     */
    public LiveData<Integer> contador() {
        return repositorio.contador();
    }

    /**
     * Marca una notificación concreta como leída (fire-and-forget).
     *
     * @param id identificador de la notificación.
     */
    public void marcarLeida(String id) {
        repositorio.marcarLeida(id);
    }

    /**
     * Marca todas las notificaciones del usuario como leídas.
     *
     * @return LiveData con {@code true} si la operación tuvo éxito, {@code false} en caso contrario.
     */
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

    /**
     * Registra el token FCM del dispositivo (best-effort).
     *
     * @param token token de Firebase Cloud Messaging del dispositivo actual.
     */
    public void registrarTokenFcm(String token) {
        repositorio.registrarTokenFcm(token);
    }
}
