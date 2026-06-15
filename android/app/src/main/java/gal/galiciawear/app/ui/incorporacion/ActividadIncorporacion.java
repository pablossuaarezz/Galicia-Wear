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

    /**
     * Infla el layout, configura el ViewPager2 con su adaptador de 3 páginas,
     * enlaza el indicador de puntos (TabLayoutMediator) y conecta los botones
     * "Saltar" y "Siguiente"/"Empezar" además del callback de cambio de página
     * que actualiza el texto del botón en la última página.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadIncorporacionBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaAutenticacion.class);

        AdaptadorIncorporacion adaptador = new AdaptadorIncorporacion(this);
        enlace.vistaPageOnboarding.setAdapter(adaptador);
        // TabLayoutMediator sincroniza el indicador de puntos con la página actual
        // del ViewPager2; el lambda vacío indica que no personalizamos cada tab.
        new TabLayoutMediator(
            enlace.indicadorPuntos, enlace.vistaPageOnboarding, (tab, pos) -> {}
        ).attach();

        enlace.botonSaltar.setOnClickListener(v -> terminarOnboarding());

        enlace.botonSiguiente.setOnClickListener(v -> {
            int paginaActual = enlace.vistaPageOnboarding.getCurrentItem();
            if (paginaActual < adaptador.getItemCount() - 1) {
                // Avanza a la siguiente página con animación de deslizamiento.
                enlace.vistaPageOnboarding.setCurrentItem(paginaActual + 1, true);
            } else {
                // Última página: el botón actúa como "Empezar".
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
                    // En la última página se oculta "Saltar" (ya no tiene sentido saltar nada).
                    enlace.botonSaltar.setVisibility(
                        esUltima ? android.view.View.INVISIBLE : android.view.View.VISIBLE
                    );
                }
            }
        );
    }

    /**
     * Marca el onboarding como visto (para no volver a mostrarlo en futuros
     * arranques de la app) y navega a la pantalla de autenticación, cerrando
     * esta actividad con una transición de deslizamiento.
     */
    private void terminarOnboarding() {
        modeloVista.marcarOnboardingVisto();
        startActivity(new Intent(this, ActividadAutenticacion.class));
        finish();
        overridePendingTransition(android.R.anim.slide_in_left, android.R.anim.slide_out_right);
    }
}
