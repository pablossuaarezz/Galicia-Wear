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

    private static final int DURACION_SPLASH_MS = 1800;

    private ActividadSplashBinding enlace;
    private ModeloVistaAutenticacion modeloVista;

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
            .withEndAction(() ->
                enlace.imagenLogo.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(400)
                    .start()
            ).start();

        new Handler(Looper.getMainLooper()).postDelayed(
            this::navegarSiguientePantalla,
            DURACION_SPLASH_MS
        );
    }

    private void navegarSiguientePantalla() {
        if (!modeloVista.onboardingYaVisto()) {
            irA(new Intent(this, ActividadIncorporacion.class));
        } else if (!modeloVista.hayTokenAcceso()) {
            irA(new Intent(this, ActividadAutenticacion.class));
        } else if (Constantes.ROL_DISENADOR.equals(modeloVista.obtenerRol())) {
            // Diseñador con sesión: comprobamos si ya está validado antes de entrar.
            modeloVista.estaValidadoComoDisenador().observe(this, recurso -> {
                if (recurso == null || recurso.estaCargando()) return;
                boolean validado = recurso.esExito() && Boolean.TRUE.equals(recurso.datos);
                irA(new Intent(this,
                    validado ? ActividadPrincipal.class : ActividadDisenadorPendiente.class));
            });
        } else {
            irA(new Intent(this, ActividadPrincipal.class));
        }
    }

    private void irA(Intent destino) {
        startActivity(destino);
        finish(); // Eliminar del back-stack: el usuario no debe volver al splash
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
