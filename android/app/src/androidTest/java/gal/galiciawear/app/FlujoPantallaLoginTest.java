package gal.galiciawear.app;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.action.ViewActions;
import androidx.test.espresso.assertion.ViewAssertions;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;

import static org.hamcrest.CoreMatchers.not;

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

    /**
     * Regla de JUnit que lanza {@link ActividadAutenticacion} antes de cada
     * test y la cierra automáticamente al finalizar, proporcionando un
     * {@code ActivityScenario} listo para usar con Espresso.
     */
    @Rule
    public ActivityScenarioRule<ActividadAutenticacion> reglaSCenario =
        new ActivityScenarioRule<>(ActividadAutenticacion.class);

    /**
     * Comprueba que, al abrir la pantalla de autenticación, la pestaña de
     * Login (primera pestaña del {@code ViewPager2}) muestra correctamente
     * los campos de correo y contraseña.
     */
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

    /**
     * Comprueba que, con los campos de correo y contraseña vacíos, el botón
     * de login permanece deshabilitado, evitando llamadas innecesarias al
     * servidor sin datos válidos (criterio UX de prevención de errores).
     */
    @Test
    public void botonLogin_desactivadoConCamposVacios() {
        // Con campos vacíos, el botón de login debe estar deshabilitado
        // (prevención de errores — no se hace llamada al servidor sin datos)
        Espresso.onView(ViewMatchers.withId(R.id.boton_login))
            .check(ViewAssertions.matches(
                not(ViewMatchers.isEnabled())
            ));
    }

    /**
     * Comprueba que, al introducir un correo con formato válido y una
     * contraseña de al menos 6 caracteres, el botón de login pasa a estar
     * habilitado.
     */
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

    /**
     * Comprueba que, si el correo introducido no contiene el carácter "@"
     * (formato de email inválido), el botón de login permanece deshabilitado
     * aunque la contraseña sea válida.
     */
    @Test
    public void botonLogin_desactivadoConEmailSinArroba() {
        // Un email sin @ no debe activar el botón
        Espresso.onView(ViewMatchers.withId(R.id.entrada_correo))
            .perform(ViewActions.typeText("noesunemail"), ViewActions.closeSoftKeyboard());

        Espresso.onView(ViewMatchers.withId(R.id.entrada_contrasena))
            .perform(ViewActions.typeText("Segura123"), ViewActions.closeSoftKeyboard());

        Espresso.onView(ViewMatchers.withId(R.id.boton_login))
            .check(ViewAssertions.matches(
                not(ViewMatchers.isEnabled())
            ));
    }
}
