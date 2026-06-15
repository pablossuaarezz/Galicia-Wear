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

    /** Infla el layout de la slide mediante ViewBinding. */
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle saved) {
        enlace = FragmentoIncorporacionBinding.inflate(inflater, container, false);
        return enlace.getRoot();
    }

    /**
     * Lee los argumentos del fragmento (título, descripción e icono, pasados
     * por {@link AdaptadorIncorporacion}) y los aplica a las vistas correspondientes.
     */
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

    /** Libera la referencia al ViewBinding para evitar fugas de memoria. */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        enlace = null;
    }
}
