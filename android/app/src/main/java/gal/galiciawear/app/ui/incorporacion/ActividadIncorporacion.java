package gal.galiciawear.app.ui.incorporacion;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayoutMediator;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadIncorporacionBinding;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;
import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;

/**
 * Pantalla de onboarding con ViewPager2 — 3 slides.
 *
 * JUSTIFICACIÓN de ViewPager2 sobre ViewPager: ViewPager2 usa RecyclerView
 * internamente, lo que permite reciclado eficiente de páginas y soporte
 * nativo para RTL y animaciones de página personalizadas.
 *
 * Criterio psicológico: Ley de Hick — solo 3 slides concisos para no
 * abrumar al usuario con información antes de llegar al contenido real.
 */
@AndroidEntryPoint
public class ActividadIncorporacion extends AppCompatActivity {

    private ActividadIncorporacionBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadIncorporacionBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaAutenticacion.class);

        AdaptadorIncorporacion adaptador = new AdaptadorIncorporacion(this);
        enlace.vistaPageOnboarding.setAdapter(adaptador);
        new TabLayoutMediator(
            enlace.indicadorPuntos, enlace.vistaPageOnboarding, (tab, pos) -> {}
        ).attach();

        enlace.botonSaltar.setOnClickListener(v -> terminarOnboarding());

        enlace.botonSiguiente.setOnClickListener(v -> {
            int paginaActual = enlace.vistaPageOnboarding.getCurrentItem();
            if (paginaActual < adaptador.getItemCount() - 1) {
                enlace.vistaPageOnboarding.setCurrentItem(paginaActual + 1, true);
            } else {
                terminarOnboarding();
            }
        });

        // Actualizar botón en la última página
        enlace.vistaPageOnboarding.registerOnPageChangeCallback(
            new ViewPager2.OnPageChangeCallback() {
                @Override
                public void onPageSelected(int posicion) {
                    boolean esUltima = posicion == adaptador.getItemCount() - 1;
                    enlace.botonSiguiente.setText(esUltima ? "Empezar" : "Siguiente");
                    enlace.botonSaltar.setVisibility(
                        esUltima ? android.view.View.INVISIBLE : android.view.View.VISIBLE
                    );
                }
            }
        );
    }

    private void terminarOnboarding() {
        modeloVista.marcarOnboardingVisto();
        startActivity(new Intent(this, ActividadAutenticacion.class));
        finish();
        overridePendingTransition(android.R.anim.slide_in_left, android.R.anim.slide_out_right);
    }
}
