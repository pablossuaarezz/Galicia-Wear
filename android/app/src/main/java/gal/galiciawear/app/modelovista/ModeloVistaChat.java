package gal.galiciawear.app.modelovista;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Observer;
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
 * JUSTIFICACIÓN: el ViewModel mantiene la lista de mensajes viva durante rotaciones.
 * El repositorio gestiona el socket a nivel de Singleton; aquí se fusiona el historial
 * (que el servidor envía al unirse a la sala) con los mensajes nuevos en tiempo real,
 * deduplicando por id y filtrando por la conversación actual.
 */
@HiltViewModel
public class ModeloVistaChat extends ViewModel {

    private final RepositorioChat repositorioChat;
    private final GestorSesion gestorSesion;

    private final List<DtoRespuestaMensaje> lista = new ArrayList<>();
    private final MutableLiveData<List<DtoRespuestaMensaje>> mensajes = new MutableLiveData<>(new ArrayList<>());

    private final String miId;
    private String disenadorIdActual;

    // Observadores permanentes sobre el repositorio Singleton; se retiran en onCleared.
    private Observer<DtoRespuestaMensaje> observadorNuevo;
    private Observer<List<DtoRespuestaMensaje>> observadorHistorial;

    @Inject
    public ModeloVistaChat(RepositorioChat repositorioChat, GestorSesion gestorSesion) {
        this.repositorioChat = repositorioChat;
        this.gestorSesion    = gestorSesion;
        this.miId            = gestorSesion.obtenerUsuarioId();
    }

    public LiveData<List<DtoRespuestaMensaje>> observarMensajes() {
        return mensajes;
    }

    public LiveData<Boolean> observarConexion() {
        return repositorioChat.estadoConexion;
    }

    public void iniciarChat(String disenadorId) {
        this.disenadorIdActual = disenadorId;

        // Reiniciar el estado de la conversación: limpia la lista local y descarta los
        // valores residuales del repositorio Singleton (de una conversación anterior).
        lista.clear();
        mensajes.setValue(new ArrayList<>());
        repositorioChat.historial.setValue(new ArrayList<>());
        repositorioChat.nuevoMensaje.setValue(null);

        repositorioChat.conectar();
        repositorioChat.unirseASala(disenadorId);

        observadorHistorial = historico -> {
            if (historico == null) return;
            lista.clear();
            lista.addAll(historico);
            mensajes.postValue(new ArrayList<>(lista));
        };
        observadorNuevo = msg -> {
            if (msg == null || !esDeConversacionActual(msg)) return;
            if (yaPresente(msg)) return;
            lista.add(msg);
            mensajes.postValue(new ArrayList<>(lista));
        };

        repositorioChat.historial.observeForever(observadorHistorial);
        repositorioChat.nuevoMensaje.observeForever(observadorNuevo);
    }

    public void enviarMensaje(String contenido) {
        if (disenadorIdActual != null && contenido != null && !contenido.trim().isEmpty()) {
            repositorioChat.enviarMensaje(disenadorIdActual, contenido.trim());
        }
    }

    public String obtenerUsuarioId() {
        return gestorSesion.obtenerUsuarioId();
    }

    /** Un mensaje pertenece a la conversación actual si lo envía el peer o yo mismo. */
    private boolean esDeConversacionActual(DtoRespuestaMensaje msg) {
        if (msg.remitenteId == null) return false;
        return msg.remitenteId.equals(disenadorIdActual)
            || (miId != null && miId.equals(msg.remitenteId));
    }

    private boolean yaPresente(DtoRespuestaMensaje msg) {
        if (msg.id == null) return false;
        for (DtoRespuestaMensaje m : lista) {
            if (msg.id.equals(m.id)) return true;
        }
        return false;
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        // El socket no se desconecta aquí (es Singleton; se cierra al cerrar sesión),
        // pero sí retiramos los observadores permanentes para no filtrarlos.
        if (observadorNuevo != null) repositorioChat.nuevoMensaje.removeObserver(observadorNuevo);
        if (observadorHistorial != null) repositorioChat.historial.removeObserver(observadorHistorial);
    }
}
