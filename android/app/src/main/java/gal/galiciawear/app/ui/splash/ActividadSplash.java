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
import gal.galiciawear.app.ui.incorporacion.ActividadIncorporacion;
import gal.galiciawear.app.ui.principal.ActividadPrincipal;

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
        Intent destino;

        if (!modeloVista.onboardingYaVisto()) {
            destino = new Intent(this, ActividadIncorporacion.class);
        } else if (!modeloVista.hayTokenAcceso()) {
            destino = new Intent(this, ActividadAutenticacion.class);
        } else {
            destino = new Intent(this, ActividadPrincipal.class);
        }

        startActivity(destino);
        finish(); // Eliminar del back-stack: el usuario no debe volver al splash
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
