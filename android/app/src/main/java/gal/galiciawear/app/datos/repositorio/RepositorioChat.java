package gal.galiciawear.app.datos.repositorio;

import android.util.Log;

import androidx.lifecycle.MutableLiveData;

import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.BuildConfig;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaMensaje;
import gal.galiciawear.app.sesion.GestorSesion;
import io.socket.client.IO;
import io.socket.client.Socket;

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
    private Socket socket;

    public final MutableLiveData<DtoRespuestaMensaje> nuevoMensaje = new MutableLiveData<>();
    public final MutableLiveData<Boolean> estadoConexion = new MutableLiveData<>(false);

    @Inject
    public RepositorioChat(GestorSesion gestorSesion) {
        this.gestorSesion = gestorSesion;
    }

    public void conectar() {
        if (socket != null && socket.connected()) return;

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

            socket.on(Socket.EVENT_CONNECT, args ->
                estadoConexion.postValue(true));

            socket.on(Socket.EVENT_DISCONNECT, args ->
                estadoConexion.postValue(false));

            socket.on("nuevo_mensaje", args -> {
                if (args.length > 0) {
                    try {
                        JSONObject json = (JSONObject) args[0];
                        DtoRespuestaMensaje msg = new DtoRespuestaMensaje();
                        msg.id              = json.optString("id");
                        msg.contenido       = json.optString("contenido");
                        msg.remitenteId     = json.optString("remitenteId");
                        msg.remitenteNombre = json.optString("remitenteNombre");
                        msg.fechaCreacion   = json.optString("fechaCreacion");
                        nuevoMensaje.postValue(msg);
                    } catch (Exception e) {
                        Log.e(TAG, "Error parseando mensaje", e);
                    }
                }
            });

            socket.connect();

        } catch (URISyntaxException e) {
            Log.e(TAG, "URL de WebSocket inválida", e);
        }
    }

    public void unirseASala(String disenadorId) {
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
        }
    }
}
