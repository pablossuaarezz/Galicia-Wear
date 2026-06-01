package gal.galiciawear.app;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.assertion.ViewAssertions;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.MediumTest;

import org.junit.Test;
import org.junit.runner.RunWith;

import gal.galiciawear.app.datos.local.BaseDatosLocal;
import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;

import android.content.Context;
import androidx.test.platform.app.InstrumentationRegistry;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

/**
 * Test de integración del carrito local (Room).
 *
 * Verifica que las operaciones del DAO del carrito funcionan correctamente
 * en el contexto real de Android (no mock). Usa la BBDD Room real en el
 * dispositivo/emulador de test.
 */
@RunWith(AndroidJUnit4.class)
@MediumTest
public class FlujoCarritoTest {

    @Test
    public void insertarItemCarrito_persisteEnBaseDatosLocal() throws InterruptedException {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();
        BaseDatosLocal bd = BaseDatosLocal.obtenerInstancia(contexto);

        // Preparar item
        EntidadItemCarrito item = new EntidadItemCarrito();
        item.varianteId    = "variante-test-001";
        item.cantidad      = 2;
        item.nombreProducto = "Camiseta Lino Gallego";
        item.talla         = "M";
        item.color         = "Blanco";
        item.precio        = 29.99;

        // Ejecutar en hilo de I/O (Room requiere hilo separado)
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.ExecutorService ejecutor =
            java.util.concurrent.Executors.newSingleThreadExecutor();

        ejecutor.execute(() -> {
            // Limpiar estado previo
            bd.daoCarrito().vaciar();

            // Insertar
            bd.daoCarrito().insertar(item);

            // Verificar
            java.util.List<gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito> items =
                bd.daoCarrito().obtenerItems();
            assertEquals(1, items.size());
            assertEquals("variante-test-001", items.get(0).varianteId);
            assertEquals(2, items.get(0).cantidad);
            assertEquals("Camiseta Lino Gallego", items.get(0).nombreProducto);

            // Limpiar
            bd.daoCarrito().vaciar();
            latch.countDown();
        });

        latch.await(5, java.util.concurrent.TimeUnit.SECONDS);
    }

    @Test
    public void eliminarItemCarrito_loEliminaDeRoom() throws InterruptedException {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();
        BaseDatosLocal bd = BaseDatosLocal.obtenerInstancia(contexto);

        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.ExecutorService ejecutor =
            java.util.concurrent.Executors.newSingleThreadExecutor();

        ejecutor.execute(() -> {
            bd.daoCarrito().vaciar();

            EntidadItemCarrito item = new EntidadItemCarrito();
            item.varianteId = "variante-eliminar-test";
            item.cantidad = 1;
            item.nombreProducto = "Jersey Lana Atlántica";
            bd.daoCarrito().insertar(item);

            // Eliminar por varianteId
            bd.daoCarrito().eliminar("variante-eliminar-test");

            java.util.List<gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito> items =
                bd.daoCarrito().obtenerItems();
            assertEquals(0, items.size());
            latch.countDown();
        });

        latch.await(5, java.util.concurrent.TimeUnit.SECONDS);
    }
}
