package gal.galiciawear.app.datos.repositorio;

import android.util.Log;

import androidx.lifecycle.MutableLiveData;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.BuildConfig;
import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoConversacion;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioConversaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoNotificacion;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaMensaje;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;
import gal.galiciawear.app.utilidades.RespuestasApi;
import io.socket.client.IO;
import io.socket.client.Socket;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio de chat en tiempo real mediante Socket.IO.
 *
 * JUSTIFICACIÓN: Socket.IO permite comunicación bidireccional sin polling.
 * El repositorio gestiona el ciclo de vida del socket (conectar, escuchar,
 * enviar, desconectar) de forma independiente de la Activity para evitar
 * que se recreen conexiones en cada rotación de pantalla.
 *
 * Cubre requisito DAM: "Sockets/WebSockets e hilos".
 */
@Singleton
public class RepositorioChat {

    private static final String TAG = "RepositorioChat";

    private final GestorSesion gestorSesion;
    private final ServicioApi servicioApi;
    private Socket socket;
    // Sala (peer) a la que unirse en cuanto el socket esté conectado. Necesario porque
    // conectar() es asíncrono: si emitimos "unirse_sala" antes del handshake, se descarta.
    private volatile String salaPendiente;
    // Id del usuario con cuyo JWT se autenticó el socket actual. Permite detectar un
    // cambio de sesión (logout + login con otra cuenta) y reconectar con el token nuevo.
    private volatile String usuarioConectado;

    public final MutableLiveData<DtoRespuestaMensaje> nuevoMensaje = new MutableLiveData<>();
    // Historial completo de la conversación, enviado por el servidor al unirse a la sala.
    public final MutableLiveData<List<DtoRespuestaMensaje>> historial = new MutableLiveData<>();
    public final MutableLiveData<Boolean> estadoConexion = new MutableLiveData<>(false);
    // Notificaciones en tiempo real: el backend emite "nueva_notificacion" a la sala
    // personal usuario:<sub>. Llega aquí porque el socket ya está autenticado con el JWT.
    public final MutableLiveData<DtoNotificacion> nuevaNotificacion = new MutableLiveData<>();

    @Inject
    public RepositorioChat(GestorSesion gestorSesion, ServicioApi servicioApi) {
        this.gestorSesion = gestorSesion;
        this.servicioApi = servicioApi;
    }

    // ── Bandeja de conversaciones (REST) ─────────────────────────────────────

    public MutableLiveData<RecursoUi<List<DtoConversacion>>> listarConversaciones() {
        MutableLiveData<RecursoUi<List<DtoConversacion>>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.listarConversaciones().enqueue(new Callback<DtoEnvoltorioConversaciones>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioConversaciones> c,
                                   Response<DtoEnvoltorioConversaciones> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().conversaciones));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoEnvoltorioConversaciones> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /** Marca como leídos los mensajes recibidos de un peer (fire-and-forget). */
    public void marcarLeida(String peerId) {
        servicioApi.marcarConversacionLeida(peerId).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) { /* sin acción */ }
            @Override public void onFailure(Call<Void> c, Throwable t) { /* sin acción */ }
        });
    }

    public void conectar() {
        String usuarioActual = gestorSesion.obtenerUsuarioId();

        // Reutilizar el socket solo si ya está conectado para el MISMO usuario.
        if (socket != null && socket.connected()
                && usuarioActual != null && usuarioActual.equals(usuarioConectado)) {
            return;
        }

        // Socket de otro usuario (cambio de sesión) o no conectado: cerrarlo y recrearlo
        // para autenticar el handshake con el token de la cuenta actual.
        if (socket != null) {
            socket.disconnect();
            socket.off();
            socket = null;
        }
        usuarioConectado = usuarioActual;

        try {
            IO.Options opciones = new IO.Options();
            opciones.reconnection        = true;
            opciones.reconnectionAttempts = 5;
            // JUSTIFICACIÓN: En socket.io-client-java 2.x, el campo `auth` es un
            // Map<String,String> que se envía en la fase de handshake de Socket.IO v4.
            // Se rellena con el token JWT actual antes de conectar.
            Map<String, String> datosAuth = new HashMap<>();
            String token = gestorSesion.obtenerTokenAcceso();
            if (token != null) {
                datosAuth.put("token", token);
            }
            opciones.auth = datosAuth;

            socket = IO.socket(BuildConfig.URL_WEBSOCKET, opciones);

            socket.on(Socket.EVENT_CONNECT, args -> {
                estadoConexion.postValue(true);
                // Unirse (o re-unirse tras una reconexión) a la sala pendiente una vez
                // establecida la conexión: aquí sí está garantizado socket.connected().
                if (salaPendiente != null) {
                    socket.emit("unirse_sala", salaPendiente);
                }
            });

            socket.on(Socket.EVENT_DISCONNECT, args ->
                estadoConexion.postValue(false));

            socket.on("nuevo_mensaje", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    DtoRespuestaMensaje msg = parsearMensaje((JSONObject) args[0]);
                    if (msg != null) nuevoMensaje.postValue(msg);
                }
            });

            // Notificaciones in-app en tiempo real (pedidos y mensajes). El mismo socket
            // sirve para chat y notificaciones; el backend nos unió a la sala personal.
            socket.on("nueva_notificacion", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    DtoNotificacion notif = parsearNotificacion((JSONObject) args[0]);
                    if (notif != null) nuevaNotificacion.postValue(notif);
                }
            });

            // Al unirse a la sala el servidor envía el historial (array de mensajes).
            socket.on("mensaje_historial", args -> {
                if (args.length > 0 && args[0] instanceof JSONArray) {
                    JSONArray arreglo = (JSONArray) args[0];
                    List<DtoRespuestaMensaje> lista = new ArrayList<>();
                    for (int i = 0; i < arreglo.length(); i++) {
                        DtoRespuestaMensaje msg = parsearMensaje(arreglo.optJSONObject(i));
                        if (msg != null) lista.add(msg);
                    }
                    historial.postValue(lista);
                }
            });

            socket.connect();

        } catch (URISyntaxException e) {
            Log.e(TAG, "URL de WebSocket inválida", e);
        }
    }

    public void unirseASala(String disenadorId) {
        // Recordamos la sala para (re)unirnos en el evento CONNECT. Si ya estamos
        // conectados (p. ej. al cambiar de conversación), nos unimos de inmediato.
        salaPendiente = disenadorId;
        if (socket != null && socket.connected()) {
            socket.emit("unirse_sala", disenadorId);
        }
    }

    public void enviarMensaje(String disenadorId, String contenido) {
        if (socket != null && socket.connected()) {
            JSONObject datos = new JSONObject();
            try {
                datos.put("disenadorId", disenadorId);
                datos.put("contenido",   contenido);
                socket.emit("enviar_mensaje", datos);
            } catch (Exception e) {
                Log.e(TAG, "Error enviando mensaje", e);
            }
        }
    }

    public void desconectar() {
        if (socket != null) {
            socket.disconnect();
            socket.off();
            socket = null;
        }
        usuarioConectado = null;
        salaPendiente = null;
        estadoConexion.postValue(false);
    }

    /** Convierte el JSON de una notificación (evento "nueva_notificacion") en su DTO. */
    private DtoNotificacion parsearNotificacion(JSONObject json) {
        if (json == null) return null;
        try {
            DtoNotificacion notif = new DtoNotificacion();
            notif.id            = json.optString("id");
            notif.tipo          = json.optString("tipo");
            notif.titulo        = json.optString("titulo");
            notif.cuerpo        = json.optString("cuerpo");
            notif.leida         = json.optBoolean("leida", false);
            notif.fechaCreacion = json.optString("fechaCreacion");
            JSONObject datos = json.optJSONObject("datos");
            if (datos != null) {
                notif.datos = new HashMap<>();
                for (java.util.Iterator<String> it = datos.keys(); it.hasNext(); ) {
                    String clave = it.next();
                    notif.datos.put(clave, datos.optString(clave));
                }
            }
            return notif;
        } catch (Exception e) {
            Log.e(TAG, "Error parseando notificación", e);
            return null;
        }
    }

    /** Convierte el JSON de un mensaje (evento socket) en su DTO. */
    private DtoRespuestaMensaje parsearMensaje(JSONObject json) {
        if (json == null) return null;
        try {
            DtoRespuestaMensaje msg = new DtoRespuestaMensaje();
            msg.id              = json.optString("id");
            msg.contenido       = json.optString("contenido");
            msg.remitenteId     = json.optString("remitenteId");
            msg.remitenteNombre = json.optString("remitenteNombre");
            msg.fechaCreacion   = json.optString("fechaCreacion");
            msg.leido           = json.optBoolean("leido", false);
            return msg;
        } catch (Exception e) {
            Log.e(TAG, "Error parseando mensaje", e);
            return null;
        }
    }
}
