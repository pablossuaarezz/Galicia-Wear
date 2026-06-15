package gal.galiciawear.app.ui.splash;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import dagger.hilt.android.AndroidEntryPoint;
import gal.galiciawear.app.databinding.ActividadSplashBinding;
import gal.galiciawear.app.modelovista.ModeloVistaAutenticacion;
import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;
import gal.galiciawear.app.ui.disenador.ActividadDisenadorPendiente;
import gal.galiciawear.app.ui.incorporacion.ActividadIncorporacion;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;
import gal.galiciawear.app.utilidades.Constantes;

/**
 * Pantalla de splash con logo animado.
 * Decide a dónde navegar según el estado de sesión:
 *   - Sin onboarding visto → Incorporación
 *   - Con onboarding pero sin token → Autenticación
 *   - Con token válido → Principal
 *
 * @SuppressLint("CustomSplashScreen"): desde Android 12 hay un Splash Screen API
 * nativo, pero esta implementación manual se mantiene para compatibilidad con
 * minSdk 24 sin añadir la dependencia `core-splashscreen`.
 */
@SuppressLint("CustomSplashScreen")
@AndroidEntryPoint
public class ActividadSplash extends AppCompatActivity {

    /** Tiempo (en milisegundos) que se muestra el splash antes de navegar a la siguiente pantalla. */
    private static final int DURACION_SPLASH_MS = 1800;

    /** Enlace generado por View Binding para acceder a las vistas del layout. */
    private ActividadSplashBinding enlace;
    /** ViewModel utilizado para consultar el estado de la sesión (onboarding, token, rol). */
    private ModeloVistaAutenticacion modeloVista;

    /**
     * Infla el layout, lanza la animación del logo (fade-in + escala) y
     * programa, transcurridos {@link #DURACION_SPLASH_MS} milisegundos,
     * la decisión de a qué pantalla navegar según el estado de la sesión.
     *
     * @param savedInstanceState estado previamente guardado de la actividad, o {@code null}.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enlace = ActividadSplashBinding.inflate(getLayoutInflater());
        setContentView(enlace.getRoot());

        modeloVista = new ViewModelProvider(this).get(ModeloVistaAutenticacion.class);

        // Animación del logo: fade-in + leve escala
        enlace.imagenLogo.setAlpha(0f);
        enlace.imagenLogo.animate()
            .alpha(1f)
            .scaleX(1.05f)
            .scaleY(1.05f)
            .setDuration(900)
            // Al terminar el fade-in con sobre-escala (1.05x), se reduce de nuevo a 1x
            // para crear un efecto de "rebote" suave.
            .withEndAction(() ->
                enlace.imagenLogo.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(400)
                    .start()
            ).start();

        // Tras DURACION_SPLASH_MS, se decide la pantalla de destino en el hilo principal.
        new Handler(Looper.getMainLooper()).postDelayed(
            this::navegarSiguientePantalla,
            DURACION_SPLASH_MS
        );
    }

    /**
     * Determina y ejecuta la navegación a la siguiente pantalla en función del
     * estado de la sesión:
     * <ul>
     *   <li>Si el onboarding no se ha visto todavía, va a {@link ActividadIncorporacion}.</li>
     *   <li>Si no hay token de acceso guardado, va a {@link ActividadAutenticacion}.</li>
     *   <li>Si el usuario tiene rol DISEÑADOR, comprueba de forma asíncrona si está
     *       validado para decidir entre {@link ActividadPrincipal} y
     *       {@link ActividadDisenadorPendiente}.</li>
     *   <li>En cualquier otro caso (cliente con sesión válida), va a {@link ActividadPrincipal}.</li>
     * </ul>
     */
    private void navegarSiguientePantalla() {
        if (!modeloVista.onboardingYaVisto()) {
            irA(new Intent(this, ActividadIncorporacion.class));
        } else if (!modeloVista.hayTokenAcceso()) {
            irA(new Intent(this, ActividadAutenticacion.class));
        } else if (Constantes.ROL_DISENADOR.equals(modeloVista.obtenerRol())) {
            // Diseñador con sesión: comprobamos si ya está validado antes de entrar.
            modeloVista.estaValidadoComoDisenador().observe(this, recurso -> {
                // Se ignoran los estados intermedios (nulo o cargando) hasta tener una respuesta definitiva.
                if (recurso == null || recurso.estaCargando()) return;
                boolean validado = recurso.esExito() && Boolean.TRUE.equals(recurso.datos);
                irA(new Intent(this,
                    validado ? ActividadPrincipal.class : ActividadDisenadorPendiente.class));
            });
        } else {
            irA(new Intent(this, ActividadPrincipal.class));
        }
    }

    /**
     * Inicia la actividad de destino, finaliza el splash (para que no quede en
     * el back-stack y el usuario no pueda volver a él) y aplica una transición
     * de cruce de opacidad (fade in/out).
     *
     * @param destino intent de la actividad a la que se navega.
     */
    private void irA(Intent destino) {
        startActivity(destino);
        finish(); // Eliminar del back-stack: el usuario no debe volver al splash
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
