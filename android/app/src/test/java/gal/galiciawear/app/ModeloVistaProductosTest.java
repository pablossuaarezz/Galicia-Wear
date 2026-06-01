package gal.galiciawear.app;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.Observer;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.repositorio.RepositorioProductos;
import gal.galiciawear.app.modelovista.ModeloVistaProductos;
import gal.galiciawear.app.utilidades.RecursoUi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import androidx.lifecycle.MutableLiveData;

/**
 * Test unitario del ModeloVistaProductos.
 *
 * JUSTIFICACIÓN: Usamos Mockito para aislar el ViewModel del repositorio.
 * Así verificamos la lógica de la capa de presentación sin necesitar red
 * ni BBDD real. El @Rule InstantTaskExecutorRule fuerza a LiveData a ejecutar
 * en el hilo de test en lugar de Looper.getMainLooper().
 *
 * Cubre requisito DAM: "Testing básico — tests unitarios".
 */
public class ModeloVistaProductosTest {

    // Ejecuta los observadores de LiveData de forma síncrona en tests
    @Rule
    public InstantTaskExecutorRule reglaTareaInstantanea = new InstantTaskExecutorRule();

    @Mock
    RepositorioProductos repositorioMock;

    private ModeloVistaProductos modeloVista;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        modeloVista = new ModeloVistaProductos(repositorioMock);
    }

    @Test
    public void cargarProductos_sinFiltros_llamaAlRepositorioConPaginaUno() {
        // Preparar
        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> livedataMock =
            new MutableLiveData<>();
        when(repositorioMock.cargarProductos(
            isNull(), isNull(), isNull(), isNull(), isNull(), anyInt()
        )).thenReturn(livedataMock);

        // Ejecutar
        modeloVista.cargarProductos();

        // Verificar
        verify(repositorioMock).cargarProductos(
            isNull(), isNull(), isNull(), isNull(), isNull(), anyInt()
        );
    }

    @Test
    public void estadoCargando_alCargarProductos_esExito_cuandoLlegaDatos() {
        // Preparar
        DtoRespuestaProducto productoFicticio = new DtoRespuestaProducto();
        productoFicticio.id     = "prod-test-1";
        productoFicticio.nombre = "Camiseta Lino Gallego";
        productoFicticio.precio = 29.99;
        productoFicticio.slug   = "camiseta-lino-gallego";

        List<DtoRespuestaProducto> listaEsperada = Arrays.asList(productoFicticio);

        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> livedataMock =
            new MutableLiveData<>();
        when(repositorioMock.cargarProductos(
            any(), any(), any(), any(), any(), anyInt()
        )).thenReturn(livedataMock);

        modeloVista.cargarProductos();

        // Simular respuesta exitosa del repositorio
        livedataMock.setValue(RecursoUi.exito(listaEsperada));

        // Verificar que el LiveData expone los datos
        RecursoUi<List<DtoRespuestaProducto>> resultado =
            modeloVista.observarProductos().getValue();

        assertNotNull(resultado);
        assertEquals(RecursoUi.Estado.EXITO, resultado.estado);
        assertEquals(1, resultado.datos.size());
        assertEquals("Camiseta Lino Gallego", resultado.datos.get(0).nombre);
    }

    @Test
    public void aplicarFiltros_conMaterial_pasaMaterialAlRepositorio() {
        // Preparar
        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> livedataMock =
            new MutableLiveData<>();
        when(repositorioMock.cargarProductos(
            any(), any(), any(), any(), any(), anyInt()
        )).thenReturn(livedataMock);

        // Ejecutar — aplicar filtro de material
        modeloVista.aplicarFiltros("", "LINO", "", null, "");

        // El getter del filtro debe reflejar el material aplicado
        assertEquals("LINO", modeloVista.getFiltroMaterial());
    }

    @Test
    public void limpiarFiltros_restableceFiltrosAVacio() {
        // Preparar
        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> livedataMock =
            new MutableLiveData<>();
        when(repositorioMock.cargarProductos(
            any(), any(), any(), any(), any(), anyInt()
        )).thenReturn(livedataMock);

        // Aplicar y limpiar
        modeloVista.aplicarFiltros("busqueda", "LINO", "CORUNA", 50, "GOTS");
        modeloVista.limpiarFiltros();

        assertEquals("", modeloVista.getFiltroMaterial());
        assertEquals("", modeloVista.getFiltroBusqueda());
    }
}
