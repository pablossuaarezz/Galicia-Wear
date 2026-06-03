package gal.galiciawear.app.ui.autenticacion;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadAutenticacionBinding;
import gal.galiciawear.app.ui.disenador.ActividadDisenadorPendiente;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;

/**
 * Contenedor de Login + Registro con ViewPager2 + TabLayout Material3.
 *
 * JUSTIFICACIÓN del uso de ViewPager2 para tabs: permite deslizar entre
 * Login y Registro sin recargar el estado de los campos. Si el usuario
 * escribe el correo en Login y desliza a Registro, el correo se conserva.
 */
@AndroidEntryPoint
public class ActividadAutenticacion extends AppCompatActivity {

    private ActividadAutenticacionBinding enlace;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadAutenticacionBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        AdaptadorPaginasAuth adaptador = new AdaptadorPaginasAuth(this);
        enlace.vistaPageAuth.setAdapter(adaptador);

        new TabLayoutMediator(enlace.pestanasAuth, enlace.vistaPageAuth, (tab, pos) -> {
            tab.setText(pos == 0 ? "Iniciar sesión" : "Crear cuenta");
        }).attach();
    }

    public void navegarAPrincipal() {
        startActivity(new Intent(this, ActividadPrincipal.class));
        finishAffinity(); // Limpia todo el stack: no se puede volver al login
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    /** Diseñador sin validar: pantalla de espera con refrescar e iniciar como cliente. */
    public void navegarAPendienteDisenador() {
        startActivity(new Intent(this, ActividadDisenadorPendiente.class));
        finishAffinity();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    // ── Inner adapter para ViewPager2 ────────────────────────────────────────

    static class AdaptadorPaginasAuth extends androidx.viewpager2.adapter.FragmentStateAdapter {
        AdaptadorPaginasAuth(AppCompatActivity activity) { super(activity); }

        @Override public int getItemCount() { return 2; }

        @Override
        public androidx.fragment.app.Fragment createFragment(int posicion) {
            return posicion == 0 ? new FragmentoLogin() : new FragmentoRegistro();
        }
    }
}
