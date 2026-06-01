package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaMensaje;
import gal.galiciawear.app.datos.repositorio.RepositorioChat;
import gal.galiciawear.app.sesion.GestorSesion;

/**
 * ViewModel del chat con Socket.IO.
 *
 * JUSTIFICACIÓN: El ViewModel mantiene la lista de mensajes viva durante
 * rotaciones de pantalla. El repositorio de chat gestiona el socket a nivel
 * de Singleton, así que la reconexión no ocurre por cada rotación.
 */
@HiltViewModel
public class ModeloVistaChat extends ViewModel {

    private final RepositorioChat repositorioChat;
    private final GestorSesion gestorSesion;

    private final MutableLiveData<List<DtoRespuestaMensaje>> mensajes = new MutableLiveData<>(new ArrayList<>());
    private String disenadorIdActual;

    @Inject
    public ModeloVistaChat(RepositorioChat repositorioChat, GestorSesion gestorSesion) {
        this.repositorioChat = repositorioChat;
        this.gestorSesion    = gestorSesion;
    }

    public LiveData<List<DtoRespuestaMensaje>> observarMensajes() {
        return mensajes;
    }

    public LiveData<Boolean> observarConexion() {
        return repositorioChat.estadoConexion;
    }

    public void iniciarChat(String disenadorId) {
        this.disenadorIdActual = disenadorId;
        repositorioChat.conectar();
        repositorioChat.unirseASala(disenadorId);

        // Observar mensajes nuevos del socket y añadirlos a la lista local
        repositorioChat.nuevoMensaje.observeForever(msg -> {
            if (msg == null) return;
            List<DtoRespuestaMensaje> actuales = mensajes.getValue();
            if (actuales == null) actuales = new ArrayList<>();
            List<DtoRespuestaMensaje> nuevaLista = new ArrayList<>(actuales);
            nuevaLista.add(msg);
            mensajes.postValue(nuevaLista);
        });
    }

    public void enviarMensaje(String contenido) {
        if (disenadorIdActual != null && !contenido.trim().isEmpty()) {
            repositorioChat.enviarMensaje(disenadorIdActual, contenido);
        }
    }

    public String obtenerUsuarioId() {
        return gestorSesion.obtenerUsuarioId();
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        // No desconectamos el socket aquí porque es Singleton; se desconecta
        // cuando el usuario cierra sesión, no al destruir el ViewModel.
    }
}
