package gal.galiciawear.app;

import android.content.Context;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.*;

/**
 * Test instrumentado básico (plantilla generada por Android Studio).
 * Comprueba que el contexto de la aplicación bajo test se corresponde con
 * el paquete de la app GaliciaWear, verificando así que el entorno de
 * pruebas instrumentadas está correctamente configurado.
 *
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {
    /**
     * Verifica que el nombre de paquete del contexto de la aplicación bajo
     * test coincide con el paquete esperado de GaliciaWear.
     */
    @Test
    public void useAppContext() {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("gal.galiciawear.app", appContext.getPackageName());
    }
}