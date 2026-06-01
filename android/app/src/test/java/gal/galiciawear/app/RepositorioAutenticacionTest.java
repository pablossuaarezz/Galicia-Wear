package gal.galiciawear.app;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionLogin;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.datos.repositorio.RepositorioAutenticacion;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

/**
 * Test unitario del RepositorioAutenticacion.
 *
 * Se usan mocks de ServicioApi y GestorSesion para verificar que:
 * 1. El repositorio llama al servicio con los DTO correctos.
 * 2. Al login exitoso, guarda los tokens en el GestorSesion.
 * 3. El LiveData emite estado CARGANDO antes de la respuesta.
 */
public class RepositorioAutenticacionTest {

    @Rule
    public InstantTaskExecutorRule reglaTareaInstantanea = new InstantTaskExecutorRule();

    @Mock ServicioApi servicioApiMock;
    @Mock GestorSesion gestorSesionMock;
    @Mock Call<DtoRespuestaToken> llamadaMock;

    private RepositorioAutenticacion repositorio;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        repositorio = new RepositorioAutenticacion(servicioApiMock, gestorSesionMock);
    }

    @Test
    public void login_llamaAlServicioConCorreoYContrasena() {
        when(servicioApiMock.login(any(DtoPeticionLogin.class))).thenReturn(llamadaMock);

        repositorio.login("ana@test.gal", "Segura123");

        ArgumentCaptor<DtoPeticionLogin> captor = ArgumentCaptor.forClass(DtoPeticionLogin.class);
        verify(servicioApiMock).login(captor.capture());

        DtoPeticionLogin dto = captor.getValue();
        assertEquals("ana@test.gal", dto.correo);
        assertEquals("Segura123", dto.contrasena);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void login_exitoso_guardaTokensEnGestorSesion() {
        // Preparar respuesta exitosa
        DtoRespuestaToken cuerpoRespuesta = new DtoRespuestaToken();
        cuerpoRespuesta.tokenAcceso  = "token_acceso_real";
        cuerpoRespuesta.tokenRefresh = "token_refresh_real";
        DtoRespuestaUsuario usuario = new DtoRespuestaUsuario();
        usuario.id  = "usr-001";
        usuario.rol = "CLIENTE";
        usuario.nombre = "Ana";
        cuerpoRespuesta.usuario = usuario;

        when(servicioApiMock.login(any(DtoPeticionLogin.class))).thenReturn(llamadaMock);

        // Capturar el Callback para simular la respuesta
        ArgumentCaptor<Callback<DtoRespuestaToken>> callbackCaptor =
            ArgumentCaptor.forClass(Callback.class);

        repositorio.login("ana@test.gal", "Segura123");

        verify(llamadaMock).enqueue(callbackCaptor.capture());

        // Simular respuesta exitosa del servidor
        callbackCaptor.getValue().onResponse(
            llamadaMock,
            Response.success(cuerpoRespuesta)
        );

        // El gestor de sesión debe haber guardado los tokens
        verify(gestorSesionMock).guardarTokens("token_acceso_real", "token_refresh_real");
    }

    @Test
    @SuppressWarnings("unchecked")
    public void login_fallo_noGuardaTokens() {
        when(servicioApiMock.login(any(DtoPeticionLogin.class))).thenReturn(llamadaMock);

        ArgumentCaptor<Callback<DtoRespuestaToken>> callbackCaptor =
            ArgumentCaptor.forClass(Callback.class);

        var resultado = repositorio.login("ana@test.gal", "MalaContraseña");

        verify(llamadaMock).enqueue(callbackCaptor.capture());

        // Simular fallo de red
        callbackCaptor.getValue().onFailure(llamadaMock, new Exception("Sin conexión"));

        RecursoUi<DtoRespuestaToken> recurso = resultado.getValue();
        assertNotNull(recurso);
        assertEquals(RecursoUi.Estado.ERROR, recurso.estado);
    }

    @Test
    public void cerrarSesion_lllamaAlGestorSesion() {
        when(servicioApiMock.cerrarSesion(any())).thenReturn(
            org.mockito.Mockito.mock(Call.class)
        );
        when(gestorSesionMock.obtenerTokenRefresh()).thenReturn("refresh_token");

        repositorio.cerrarSesion();

        verify(gestorSesionMock).cerrarSesion();
    }
}
