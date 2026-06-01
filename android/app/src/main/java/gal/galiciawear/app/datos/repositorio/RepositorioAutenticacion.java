package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionLogin;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionRegistro;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import gal.galiciawear.app.sesion.GestorSesion;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio de autenticación.
 * Encapsula todas las operaciones de red relacionadas con el usuario
 * (login, registro, refresh, logout) y gestiona el estado de sesión local.
 *
 * JUSTIFICACIÓN del patrón Repository: los ViewModels no conocen la fuente
 * de datos (red o local). Si en el futuro el login se cachea offline,
 * el cambio es transparente para el ViewModel.
 */
@Singleton
public class RepositorioAutenticacion {

    private final ServicioApi servicioApi;
    private final GestorSesion gestorSesion;

    @Inject
    public RepositorioAutenticacion(ServicioApi servicioApi, GestorSesion gestorSesion) {
        this.servicioApi  = servicioApi;
        this.gestorSesion = gestorSesion;
    }

    /**
     * Extrae el mensaje útil de una respuesta de error del backend.
     * El backend devuelve JSON con forma:
     *   { "error": "...", "codigo": "...", "detalles": [{ "campo": "...", "mensaje": "..." }] }
     * Si hay detalles de validación, devolvemos el primer mensaje específico
     * (p.ej. "Debe incluir al menos una letra mayúscula"); si no, el campo `error` general.
     *
     * JUSTIFICACIÓN: antes mostrábamos un texto genérico ("El correo ya existe o
     * datos inválidos") que confundía al usuario porque ocultaba el motivo real.
     */
    private String extraerMensajeError(Response<?> r) {
        try {
            if (r.errorBody() == null) return "Error " + r.code();
            String cuerpo = r.errorBody().string();
            JsonObject obj = JsonParser.parseString(cuerpo).getAsJsonObject();
            if (obj.has("detalles") && obj.get("detalles").isJsonArray()) {
                JsonArray det = obj.getAsJsonArray("detalles");
                if (det.size() > 0 && det.get(0).getAsJsonObject().has("mensaje")) {
                    return det.get(0).getAsJsonObject().get("mensaje").getAsString();
                }
            }
            if (obj.has("error")) return obj.get("error").getAsString();
            return "Error " + r.code();
        } catch (Exception e) {
            return "Error " + r.code();
        }
    }

    public MutableLiveData<RecursoUi<DtoRespuestaToken>> login(String correo, String contrasena) {
        MutableLiveData<RecursoUi<DtoRespuestaToken>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.login(new DtoPeticionLogin(correo, contrasena))
            .enqueue(new Callback<DtoRespuestaToken>() {
                @Override
                public void onResponse(Call<DtoRespuestaToken> call, Response<DtoRespuestaToken> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        DtoRespuestaToken cuerpo = r.body();
                        gestorSesion.guardarTokens(cuerpo.tokenAcceso, cuerpo.tokenRefresh);
                        if (cuerpo.usuario != null) {
                            gestorSesion.guardarDatosUsuario(
                                cuerpo.usuario.id,
                                cuerpo.usuario.rol,
                                cuerpo.usuario.nombre
                            );
                        }
                        resultado.postValue(RecursoUi.exito(cuerpo));
                    } else {
                        resultado.postValue(RecursoUi.error(extraerMensajeError(r)));
                    }
                }

                @Override
                public void onFailure(Call<DtoRespuestaToken> call, Throwable t) {
                    resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
                }
            });

        return resultado;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaToken>> registro(
        String correo, String contrasena, String nombre, String apellidos, String rol
    ) {
        MutableLiveData<RecursoUi<DtoRespuestaToken>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.registro(new DtoPeticionRegistro(correo, contrasena, nombre, apellidos, rol))
            .enqueue(new Callback<DtoRespuestaToken>() {
                @Override
                public void onResponse(Call<DtoRespuestaToken> call, Response<DtoRespuestaToken> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        DtoRespuestaToken cuerpo = r.body();
                        gestorSesion.guardarTokens(cuerpo.tokenAcceso, cuerpo.tokenRefresh);
                        if (cuerpo.usuario != null) {
                            gestorSesion.guardarDatosUsuario(
                                cuerpo.usuario.id, cuerpo.usuario.rol, cuerpo.usuario.nombre
                            );
                        }
                        resultado.postValue(RecursoUi.exito(cuerpo));
                    } else {
                        resultado.postValue(RecursoUi.error(extraerMensajeError(r)));
                    }
                }

                @Override
                public void onFailure(Call<DtoRespuestaToken> call, Throwable t) {
                    resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
                }
            });

        return resultado;
    }

    public MutableLiveData<RecursoUi<DtoRespuestaUsuario>> obtenerPerfil() {
        MutableLiveData<RecursoUi<DtoRespuestaUsuario>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.obtenerPerfil().enqueue(new Callback<DtoRespuestaUsuario>() {
            @Override
            public void onResponse(Call<DtoRespuestaUsuario> call, Response<DtoRespuestaUsuario> r) {
                if (r.isSuccessful() && r.body() != null) {
                    resultado.postValue(RecursoUi.exito(r.body()));
                } else {
                    resultado.postValue(RecursoUi.error("No se pudo cargar el perfil"));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaUsuario> call, Throwable t) {
                resultado.postValue(RecursoUi.error(t.getMessage()));
            }
        });

        return resultado;
    }

    public void cerrarSesion() {
        Map<String, String> cuerpo = new HashMap<>();
        String tokenRefresh = gestorSesion.obtenerTokenRefresh();
        if (tokenRefresh != null) {
            cuerpo.put("tokenRefresh", tokenRefresh);
        }
        // Fire-and-forget: aunque falle la llamada al servidor, cerramos sesión local
        servicioApi.cerrarSesion(cuerpo).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) { }
            @Override public void onFailure(Call<Void> c, Throwable t) { }
        });
        gestorSesion.cerrarSesion();
    }

    public boolean hayTokenAcceso() {
        return gestorSesion.hayTokenAcceso();
    }

    public boolean onboardingYaVisto() {
        return gestorSesion.onboardingYaVisto();
    }

    public void marcarOnboardingVisto() {
        gestorSesion.marcarOnboardingVisto();
    }
}
