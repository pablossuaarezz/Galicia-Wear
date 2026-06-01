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

    @Override
    public void onCreate() {
        super.onCreate();
        crearCanalNotificaciones();
    }

    // Android 8+ requiere declarar canales antes de mostrar notificaciones.
    // Sin canal, las notificaciones FCM se silencian en API 26+.
    private void crearCanalNotificaciones() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel canal = new NotificationChannel(
                getString(R.string.canal_notificaciones_id),
                getString(R.string.canal_notificaciones_nombre),
                NotificationManager.IMPORTANCE_HIGH
            );
            canal.setDescription(getString(R.string.canal_notificaciones_descripcion));
            canal.enableVibration(true);

            NotificationManager gestor = getSystemService(NotificationManager.class);
            if (gestor != null) {
                gestor.createNotificationChannel(canal);
            }
        }
    }
}
