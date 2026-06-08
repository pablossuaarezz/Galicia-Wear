package gal.galiciawear.app.ui.notificaciones;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.R;
import gal.galiciawear.app.databinding.ActividadNotificacionesBinding;

/**
 * Contenedor de la bandeja de notificaciones. Aloja {@link FragmentoNotificaciones}
 * (toda la lógica de lista/navegación vive en el fragmento) y aporta la barra superior
 * con el botón "atrás" y la acción "marcar todas como leídas".
 */
@AndroidEntryPoint
public class ActividadNotificaciones extends AppCompatActivity {

    private ActividadNotificacionesBinding enlace;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadNotificacionesBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        enlace.barraHerramientas.setNavigationOnClickListener(v -> finish());
        enlace.barraHerramientas.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.accion_marcar_todas) {
                FragmentoNotificaciones frag = (FragmentoNotificaciones)
                    getSupportFragmentManager().findFragmentById(R.id.contenedor_notificaciones);
                if (frag != null) frag.marcarTodasLeidas();
                return true;
            }
            return false;
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        enlace = null;
    }
}
