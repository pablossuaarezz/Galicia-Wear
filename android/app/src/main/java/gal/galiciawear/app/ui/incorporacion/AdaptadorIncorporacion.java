package gal.galiciawear.app.ui.incorporacion;

import android.content.Context;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

/**
 * Adaptador de las 3 páginas de onboarding.
 * Cada página es un FragmentoIncorporacion con argumentos distintos.
 */
public class AdaptadorIncorporacion extends FragmentStateAdapter {

    // Datos de cada slide — encapsulados aquí para no hardcodear en el Fragment
    private static final int[] TITULOS = {
        gal.galiciawear.app.R.string.onboarding_titulo_1,
        gal.galiciawear.app.R.string.onboarding_titulo_2,
        gal.galiciawear.app.R.string.onboarding_titulo_3
    };
    private static final int[] DESCRIPCIONES = {
        gal.galiciawear.app.R.string.onboarding_desc_1,
        gal.galiciawear.app.R.string.onboarding_desc_2,
        gal.galiciawear.app.R.string.onboarding_desc_3
    };
    private static final int[] ICONOS = {
        gal.galiciawear.app.R.drawable.ic_onboarding_moda,
        gal.galiciawear.app.R.drawable.ic_onboarding_sostenibilidad,
        gal.galiciawear.app.R.drawable.ic_onboarding_comunidad
    };

    public AdaptadorIncorporacion(@NonNull FragmentActivity fa) {
        super(fa);
    }

    @NonNull
    @Override
    public Fragment createFragment(int posicion) {
        Bundle args = new Bundle();
        args.putInt("titulo",      TITULOS[posicion]);
        args.putInt("descripcion", DESCRIPCIONES[posicion]);
        args.putInt("icono",       ICONOS[posicion]);
        Fragment f = new FragmentoIncorporacion();
        f.setArguments(args);
        return f;
    }

    @Override
    public int getItemCount() { return 3; }
}
