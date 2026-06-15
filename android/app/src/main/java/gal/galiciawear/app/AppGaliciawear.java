package gal.galiciawear.app;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import dagger.hilt.android.HiltAndroidApp;

/**
 * Clase Application de GaliciaWear.
 *
 * @HiltAndroidApp dispara la generación de código de Hilt en tiempo de compilación
 * y crea el contenedor de dependencias raíz, que persiste durante toda la vida
 * de la aplicación. Sin esta anotación, ningún @AndroidEntryPoint funcionaría.
 */
@HiltAndroidApp
public class AppGaliciawear extends Application {

    /**
     * Punto de entrada de la aplicación: se ejecuta antes que cualquier Activity.
     * Se aprovecha para crear el canal de notificaciones necesario para FCM.
     */
    @Override
    public void onCreate() {
        super.onCreate();
        crearCanalNotificaciones();
    }

    // Android 8+ requiere declarar canales antes de mostrar notificaciones.
    // Sin canal, las notificaciones FCM se silencian en API 26+.
    /**
     * Crea (o actualiza) el canal de notificaciones usado por la app.
     * Solo es necesario en API 26 (Android 8 "Oreo") o superior; en versiones
     * anteriores las notificaciones no requieren canal y la llamada se omite.
     */
    private void crearCanalNotificaciones() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // IMPORTANCE_HIGH: las notificaciones aparecen como heads-up y suenan,
            // adecuado para avisos de pedidos y mensajes de chat.
            NotificationChannel canal = new NotificationChannel(
                getString(R.string.canal_notificaciones_id),
                getString(R.string.canal_notificaciones_nombre),
                NotificationManager.IMPORTANCE_HIGH
            );
            canal.setDescription(getString(R.string.canal_notificaciones_descripcion));
            canal.enableVibration(true);

            // getSystemService puede devolver null en contextos muy restringidos;
            // se comprueba por seguridad antes de registrar el canal.
            NotificationManager gestor = getSystemService(NotificationManager.class);
            if (gestor != null) {
                gestor.createNotificationChannel(canal);
            }
        }
    }
}
