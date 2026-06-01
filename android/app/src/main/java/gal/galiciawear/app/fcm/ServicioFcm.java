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
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Servicio FCM para notificaciones push.
 *
 * JUSTIFICACIÓN: FirebaseMessagingService se ejecuta en segundo plano
 * incluso cuando la app está cerrada. Cubre el requisito DAM "Notificaciones
 * tiempo real" para el escenario: diseñador acepta pedido → cliente recibe push.
 *
 * El token FCM se envía al backend en el endpoint PUT /usuarios/yo/fcm-token
 * (pendiente de implementar en la API) para que el servidor pueda identificar
 * el dispositivo destino.
 *
 * NOTA: Requiere google-services.json real para funcionar en producción.
 * Con el stub actual, el servicio se registra pero no recibe tokens reales.
 */
@AndroidEntryPoint
public class ServicioFcm extends FirebaseMessagingService {

    @Inject
    GestorSesion gestorSesion;

    /**
     * Se llama cuando Firebase genera un nuevo token de registro para este dispositivo.
     * Ocurre en el primer arranque o cuando se invalida el token anterior.
     */
    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // TODO Fase 7: Enviar token al backend → PUT /usuarios/yo/fcm-token
        // El token identifica este dispositivo en el sistema de notificaciones.
        // gestorSesion.guardarFcmToken(token); → implementar si se necesita
    }

    /**
     * Se llama cuando llega un mensaje push mientras la app está en primer plano.
     * Si la app está en segundo plano, FCM muestra la notificación automáticamente
     * usando los campos "notification" del mensaje.
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

        // Los datos del mensaje permiten un handling más específico
        String tipo = mensaje.getData().get("tipo");
        int idNotif = Constantes.ID_NOTIF_GENERICO;
        if ("pedido".equals(tipo))  idNotif = Constantes.ID_NOTIF_PEDIDO;
        if ("mensaje".equals(tipo)) idNotif = Constantes.ID_NOTIF_MENSAJE;

        mostrarNotificacion(titulo, contenido, idNotif);
    }

    private void mostrarNotificacion(String titulo, String contenido, int id) {
        Intent intent = new Intent(this, ActividadPrincipal.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
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
