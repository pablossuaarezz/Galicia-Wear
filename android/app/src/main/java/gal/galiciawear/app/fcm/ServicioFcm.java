package gal.galiciawear.app.fcm;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.datos.repositorio.RepositorioNotificaciones;
import gal.galiciawear.app.ui.chat.ActividadChat;
import gal.galiciawear.app.ui.pedidos.ActividadDetallePedido;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Servicio FCM para notificaciones push.
 *
 * JUSTIFICACIÓN: FirebaseMessagingService se ejecuta en segundo plano
 * incluso cuando la app está cerrada. Cubre el requisito DAM "Notificaciones
 * tiempo real" para el escenario: diseñador acepta pedido → cliente recibe push.
 *
 * NOTA (estado real): google-services.json es un STUB (project_number 000000000000),
 * así que el push NO llega en esta demo. El camino fiable es in-app + Socket.IO. Este
 * servicio queda cableado para cuando exista un proyecto Firebase real: onNewToken envía
 * el token a PUT /usuarios/yo/fcm-token y onMessageReceived hace deep-link según el tipo.
 */
@AndroidEntryPoint
public class ServicioFcm extends FirebaseMessagingService {

    @Inject
    RepositorioNotificaciones repositorioNotificaciones;

    /**
     * Nuevo token de registro de este dispositivo (primer arranque o rotación de token).
     * Se envía al backend (best-effort: solo si hay sesión iniciada).
     */
    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        repositorioNotificaciones.registrarTokenFcm(token);
    }

    /**
     * Mensaje push con la app en primer plano. En segundo plano, FCM muestra la
     * notificación automáticamente con los campos "notification" del mensaje.
     */
    @Override
    public void onMessageReceived(@NonNull RemoteMessage mensaje) {
        super.onMessageReceived(mensaje);

        String titulo    = "GaliciaWear";
        String contenido = "Tienes una notificación nueva";

        if (mensaje.getNotification() != null) {
            if (mensaje.getNotification().getTitle() != null) {
                titulo = mensaje.getNotification().getTitle();
            }
            if (mensaje.getNotification().getBody() != null) {
                contenido = mensaje.getNotification().getBody();
            }
        }

        // `tipo` viene en data (p. ej. PEDIDO_PAGADO, MENSAJE_NUEVO) y guía el deep-link.
        String tipo = mensaje.getData().get("tipo");
        int idNotif = Constantes.ID_NOTIF_GENERICO;
        if (tipo != null && tipo.startsWith("PEDIDO_")) idNotif = Constantes.ID_NOTIF_PEDIDO;
        if ("MENSAJE_NUEVO".equals(tipo))               idNotif = Constantes.ID_NOTIF_MENSAJE;

        mostrarNotificacion(titulo, contenido, idNotif, tipo, mensaje);
    }

    private void mostrarNotificacion(String titulo, String contenido, int id,
                                     String tipo, RemoteMessage mensaje) {
        Intent intent;
        if (tipo != null && tipo.startsWith("PEDIDO_")) {
            intent = new Intent(this, ActividadDetallePedido.class);
            intent.putExtra(Constantes.EXTRA_PEDIDO_ID, mensaje.getData().get("pedidoId"));
        } else if ("MENSAJE_NUEVO".equals(tipo)) {
            intent = new Intent(this, ActividadChat.class);
            intent.putExtra(Constantes.EXTRA_DISENADOR_ID, mensaje.getData().get("peerId"));
            intent.putExtra(Constantes.EXTRA_DISENADOR_NOMBRE, mensaje.getData().get("nombre"));
        } else {
            intent = new Intent(this, ActividadPrincipal.class);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, id, intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            this,
            getString(R.string.canal_notificaciones_id)
        )
            .setSmallIcon(R.drawable.ic_notificacion)
            .setContentTitle(titulo)
            .setContentText(contenido)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent);

        NotificationManager gestor =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (gestor != null) {
            gestor.notify(id, builder.build());
        }
    }
}
