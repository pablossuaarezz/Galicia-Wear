package gal.galiciawear.app.ui.notificaciones;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.FragmentoNotificacionesBinding;

/**
 * Lista de notificaciones (historial).
 * En la versión completa leería de MongoDB via API (GET /notificaciones/me).
 */
@AndroidEntryPoint
public class FragmentoNotificaciones extends Fragment {

    private FragmentoNotificacionesBinding enlace;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoNotificacionesBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        enlace.textoVacio.setVisibility(View.VISIBLE);
        enlace.textoVacio.setText("No tienes notificaciones nuevas");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
