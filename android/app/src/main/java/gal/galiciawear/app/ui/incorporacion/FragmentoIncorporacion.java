package gal.galiciawear.app.ui.incorporacion;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import gal.galiciawear.app.databinding.FragmentoIncorporacionBinding;

/** Una página del onboarding — recibe título, descripción e icono por argumentos. */
public class FragmentoIncorporacion extends Fragment {

    private FragmentoIncorporacionBinding enlace;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoIncorporacionBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        Bundle args = getArguments();
        if (args != null) {
            enlace.textoTitulo.setText(args.getInt("titulo"));
            enlace.textoDescripcion.setText(args.getInt("descripcion"));
            enlace.imagenOnboarding.setImageResource(args.getInt("icono"));
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
