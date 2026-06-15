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

    /**
     * Constructor inyectado por Hilt.
     *
     * @param repositorioChat repositorio singleton que gestiona el socket de chat.
     * @param gestorSesion usado para obtener el id del usuario autenticado.
     */
    @Inject
    public ModeloVistaChat(RepositorioChat repositorioChat, GestorSesion gestorSesion) {
        this.repositorioChat = repositorioChat;
        this.gestorSesion    = gestorSesion;
        this.miId            = gestorSesion.obtenerUsuarioId();
    }

    /** @return LiveData con la lista de mensajes de la conversación actual (historial + tiempo real). */
    public LiveData<List<DtoRespuestaMensaje>> observarMensajes() {
        return mensajes;
    }

    /** @return LiveData con el estado de conexión del socket de chat. */
    public LiveData<Boolean> observarConexion() {
        return repositorioChat.estadoConexion;
    }

    /**
     * Inicia (o reinicia) la conversación de chat con un diseñador concreto.
     * Limpia el estado local y los valores residuales del repositorio Singleton
     * (de una conversación anterior), conecta el socket si es necesario, se une
     * a la sala correspondiente y registra observadores permanentes sobre el
     * historial y los mensajes nuevos del repositorio.
     *
     * @param disenadorId identificador del diseñador/peer con el que se conversa.
     */
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

        // El servidor envía el historial completo al unirse a la sala (evento "mensaje_historial").
        observadorHistorial = historico -> {
            if (historico == null) return;
            lista.clear();
            lista.addAll(historico);
            mensajes.postValue(new ArrayList<>(lista));
        };
        // Mensajes en tiempo real (evento "nuevo_mensaje"): se filtran por conversación
        // actual y se deduplican por id antes de añadirlos a la lista.
        observadorNuevo = msg -> {
            if (msg == null || !esDeConversacionActual(msg)) return;
            if (yaPresente(msg)) return;
            lista.add(msg);
            mensajes.postValue(new ArrayList<>(lista));
        };

        repositorioChat.historial.observeForever(observadorHistorial);
        repositorioChat.nuevoMensaje.observeForever(observadorNuevo);
    }

    /**
     * Envía un mensaje de texto al diseñador de la conversación actual a través
     * del socket. No hace nada si el contenido está vacío/en blanco o si no hay
     * una conversación activa.
     *
     * @param contenido texto del mensaje a enviar.
     */
    public void enviarMensaje(String contenido) {
        if (disenadorIdActual != null && contenido != null && !contenido.trim().isEmpty()) {
            repositorioChat.enviarMensaje(disenadorIdActual, contenido.trim());
        }
    }

    /** @return el id del usuario autenticado, para distinguir mensajes propios de los del peer. */
    public String obtenerUsuarioId() {
        return gestorSesion.obtenerUsuarioId();
    }

    /** Un mensaje pertenece a la conversación actual si lo envía el peer o yo mismo. */
    private boolean esDeConversacionActual(DtoRespuestaMensaje msg) {
        if (msg.remitenteId == null) return false;
        return msg.remitenteId.equals(disenadorIdActual)
            || (miId != null && miId.equals(msg.remitenteId));
    }

    /** Comprueba por id si un mensaje ya está en la lista local (evita duplicados). */
    private boolean yaPresente(DtoRespuestaMensaje msg) {
        if (msg.id == null) return false;
        for (DtoRespuestaMensaje m : lista) {
            if (msg.id.equals(m.id)) return true;
        }
        return false;
    }

    /**
     * Se ejecuta cuando el ViewModel se destruye definitivamente (no en rotaciones).
     * Retira los observadores permanentes registrados sobre el repositorio Singleton
     * para evitar fugas de memoria; el socket en sí no se desconecta aquí porque
     * es compartido (Singleton) y se cierra al cerrar sesión.
     */
    @Override
    protected void onCleared() {
        super.onCleared();
        // El socket no se desconecta aquí (es Singleton; se cierra al cerrar sesión),
        // pero sí retiramos los observadores permanentes para no filtrarlos.
        if (observadorNuevo != null) repositorioChat.nuevoMensaje.removeObserver(observadorNuevo);
        if (observadorHistorial != null) repositorioChat.historial.removeObserver(observadorHistorial);
    }
}
