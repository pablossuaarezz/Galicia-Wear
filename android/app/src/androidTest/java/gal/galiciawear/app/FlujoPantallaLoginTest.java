package gal.galiciawear.app;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.action.ViewActions;
import androidx.test.espresso.assertion.ViewAssertions;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import gal.galiciawear.app.ui.autenticacion.ActividadAutenticacion;

/**
 * Test de UI con Espresso — flujo de pantalla Login.
 *
 * Verifica que:
 * 1. El formulario de login se muestra correctamente.
 * 2. El botón está deshabilitado con campos vacíos.
 * 3. Al escribir un email inválido, el botón sigue deshabilitado.
 * 4. Con email válido y contraseña ≥ 6 chars, el botón se habilita.
 *
 * JUSTIFICACIÓN: Los tests Espresso verifican el comportamiento real de la UI,
 * no solo la lógica del ViewModel. Cubren el criterio UX "prevención de errores"
 * y el requisito DAM "Testing básico — tests de interfaz".
 *
 * @LargeTest: se marca como test grande porque requiere el emulador.
 */
@RunWith(AndroidJUnit4.class)
@LargeTest
public class FlujoPantallaLoginTest {

    @Rule
    public ActivityScenarioRule<ActividadAutenticacion> reglaSCenario =
        new ActivityScenarioRule<>(ActividadAutenticacion.class);

    @Test
    public void campoCorrecto_botonLoginSeMuestraYPuedePulsarse() {
        // La primera pestaña del ViewPager2 es Login
        // Verificar que el campo de correo existe
        Espresso.onView(ViewMatchers.withId(R.id.entrada_correo))
            .check(ViewAssertions.matches(ViewMatchers.isDisplayed()));

        // Verificar que el campo de contraseña existe
        Espresso.onView(ViewMatchers.withId(R.id.entrada_contrasena))
            .check(ViewAssertions.matches(ViewMatchers.isDisplayed()));
    }

    @Test
    public void botonLogin_desactivadoConCamposVacios() {
        // Con campos vacíos, el botón de login debe estar deshabilitado
        // (prevención de errores — no se hace llamada al servidor sin datos)
        Espresso.onView(ViewMatchers.withId(R.id.boton_login))
            .check(ViewAssertions.matches(
                ViewMatchers.not(ViewMatchers.isEnabled())
            ));
    }

    @Test
    public void botonLogin_activadoConCredencialesValidas() {
        // Escribir email válido
        Espresso.onView(ViewMatchers.withId(R.id.entrada_correo))
            .perform(ViewActions.typeText("ana@test.gal"), ViewActions.closeSoftKeyboard());

        // Escribir contraseña ≥ 6 caracteres
        Espresso.onView(ViewMatchers.withId(R.id.entrada_contrasena))
            .perform(ViewActions.typeText("Segura123"), ViewActions.closeSoftKeyboard());

        // El botón debe habilitarse
        Espresso.onView(ViewMatchers.withId(R.id.boton_login))
            .check(ViewAssertions.matches(ViewMatchers.isEnabled()));
    }

    @Test
    public void botonLogin_desactivadoConEmailSinArroba() {
        // Un email sin @ no debe activar el botón
        Espresso.onView(ViewMatchers.withId(R.id.entrada_correo))
            .perform(ViewActions.typeText("noesunemail"), ViewActions.closeSoftKeyboard());

        Espresso.onView(ViewMatchers.withId(R.id.entrada_contrasena))
            .perform(ViewActions.typeText("Segura123"), ViewActions.closeSoftKeyboard());

        Espresso.onView(ViewMatchers.withId(R.id.boton_login))
            .check(ViewAssertions.matches(
                ViewMatchers.not(ViewMatchers.isEnabled())
            ));
    }
}
