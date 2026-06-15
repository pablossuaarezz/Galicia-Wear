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
 *
 * Esta actividad actúa como contenedor/host de los fragmentos de autenticación
 * y expone métodos de navegación ({@link #navegarAPrincipal()} y
 * {@link #navegarAPendienteDisenador()}) que los fragmentos hijos invocan tras
 * un login o registro exitoso, según el rol del usuario autenticado.
 */
@AndroidEntryPoint
public class ActividadAutenticacion extends AppCompatActivity {

    private ActividadAutenticacionBinding enlace;

    /**
     * Inicializa la pantalla de autenticación: infla el binding, configura el
     * ViewPager2 con el adaptador interno {@link AdaptadorPaginasAuth} (que
     * crea los fragmentos de Login y Registro) y enlaza el TabLayout con dicho
     * ViewPager mediante un {@link TabLayoutMediator} para sincronizar las
     * pestañas con la página visible.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadAutenticacionBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        AdaptadorPaginasAuth adaptador = new AdaptadorPaginasAuth(this);
        enlace.vistaPageAuth.setAdapter(adaptador);

        // El mediador asigna el texto de cada pestaña según la posición de página
        // (0 = Login, 1 = Registro), manteniendo ambas sincronizadas al deslizar.
        new TabLayoutMediator(enlace.pestanasAuth, enlace.vistaPageAuth, (tab, pos) -> {
            tab.setText(pos == 0 ? "Iniciar sesión" : "Crear cuenta");
        }).attach();
    }

    /**
     * Navega a la pantalla principal de la app tras un login/registro exitoso.
     * Se utiliza tanto para clientes como para diseñadores ya validados.
     */
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

    /**
     * Adaptador interno que provee las dos páginas del ViewPager2: la posición 0
     * corresponde al fragmento de Login y la posición 1 al de Registro. Al ser un
     * {@link androidx.viewpager2.adapter.FragmentStateAdapter}, gestiona el ciclo
     * de vida de los fragmentos automáticamente.
     */
    static class AdaptadorPaginasAuth extends androidx.viewpager2.adapter.FragmentStateAdapter {
        AdaptadorPaginasAuth(AppCompatActivity activity) { super(activity); }

        /** Número fijo de páginas: Login y Registro. */
        @Override public int getItemCount() { return 2; }

        /** Crea el fragmento correspondiente según la posición de página. */
        @Override
        public androidx.fragment.app.Fragment createFragment(int posicion) {
            return posicion == 0 ? new FragmentoLogin() : new FragmentoRegistro();
        }
    }
}
