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
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionActualizarPerfil;
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
    private final RepositorioChat repositorioChat;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para llamar a los endpoints de autenticación.
     * @param gestorSesion encargado de persistir tokens y datos de sesión localmente.
     * @param repositorioChat se usa para desconectar el socket de chat al cerrar sesión.
     */
    @Inject
    public RepositorioAutenticacion(ServicioApi servicioApi, GestorSesion gestorSesion,
                                    RepositorioChat repositorioChat) {
        this.servicioApi  = servicioApi;
        this.gestorSesion = gestorSesion;
        this.repositorioChat = repositorioChat;
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

    /**
     * Realiza el inicio de sesión contra el backend.
     * Si la respuesta es correcta, guarda los tokens de acceso/refresco y los
     * datos básicos del usuario (id, rol, nombre) en el {@link GestorSesion}
     * para que estén disponibles en toda la app sin nuevas peticiones.
     *
     * @param correo correo electrónico introducido por el usuario.
     * @param contrasena contraseña en texto plano (se envía por HTTPS al backend).
     * @return LiveData que emite primero {@code cargando()}, y después
     *         {@code exito(token)} o {@code error(mensaje)} según el resultado.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaToken>> login(String correo, String contrasena) {
        MutableLiveData<RecursoUi<DtoRespuestaToken>> resultado = new MutableLiveData<>();
        // Emitimos el estado de carga de inmediato para que la UI muestre un spinner.
        resultado.setValue(RecursoUi.cargando());

        servicioApi.login(new DtoPeticionLogin(correo, contrasena))
            .enqueue(new Callback<DtoRespuestaToken>() {
                @Override
                public void onResponse(Call<DtoRespuestaToken> call, Response<DtoRespuestaToken> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        DtoRespuestaToken cuerpo = r.body();
                        // Persistimos los tokens para que el interceptor de Retrofit
                        // pueda añadirlos automáticamente a futuras peticiones.
                        gestorSesion.guardarTokens(cuerpo.tokenAcceso, cuerpo.tokenRefresh);
                        if (cuerpo.usuario != null) {
                            gestorSesion.guardarDatosUsuario(
                                cuerpo.usuario.id,
                                cuerpo.usuario.rol,
                                cuerpo.usuario.nombre
                            );
                        }
                        // postValue porque este callback se ejecuta en un hilo de
                        // background de OkHttp, no en el hilo principal.
                        resultado.postValue(RecursoUi.exito(cuerpo));
                    } else {
                        resultado.postValue(RecursoUi.error(extraerMensajeError(r)));
                    }
                }

                @Override
                public void onFailure(Call<DtoRespuestaToken> call, Throwable t) {
                    // Fallo de red (sin conexión, timeout, etc.), no error HTTP.
                    resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
                }
            });

        return resultado;
    }

    /**
     * Registra un nuevo usuario (cliente, diseñador, etc.) y, si el backend
     * devuelve tokens directamente, inicia sesión automáticamente igual que
     * en {@link #login(String, String)}.
     *
     * @param correo correo electrónico del nuevo usuario.
     * @param contrasena contraseña elegida (debe cumplir las reglas de validación del backend).
     * @param nombre nombre de pila.
     * @param apellidos apellidos del usuario.
     * @param rol rol con el que se registra (p.ej. "cliente" o "disenador").
     * @return LiveData con el estado de la operación (cargando/éxito/error).
     */
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

    /**
     * Obtiene del backend los datos completos del perfil del usuario autenticado.
     *
     * @return LiveData con el estado de la operación; en caso de éxito contiene
     *         el {@link DtoRespuestaUsuario} con los datos del perfil.
     */
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

    /**
     * Actualiza el perfil del cliente (nombre, apellidos, teléfono y/o avatar).
     * El backend responde 200; devolvemos un RecursoUi&lt;Void&gt; para que la UI
     * gestione cargando/éxito/error de forma uniforme.
     */
    public MutableLiveData<RecursoUi<Void>> actualizarPerfil(DtoPeticionActualizarPerfil cuerpo) {
        MutableLiveData<RecursoUi<Void>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.actualizarPerfilCliente(cuerpo).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> r) {
                if (r.isSuccessful()) {
                    // Mantén el nombre local sincronizado (cabeceras, saludos, etc.).
                    if (cuerpo.nombre != null) {
                        gestorSesion.guardarDatosUsuario(
                            gestorSesion.obtenerUsuarioId(),
                            gestorSesion.obtenerUsuarioRol(),
                            cuerpo.nombre
                        );
                    }
                    resultado.postValue(RecursoUi.exito(null));
                } else {
                    resultado.postValue(RecursoUi.error(extraerMensajeError(r)));
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });

        return resultado;
    }

    /**
     * Cierra la sesión del usuario actual.
     * Notifica al backend para invalidar el token de refresco (sin esperar
     * respuesta), desconecta el socket de chat y borra los datos de sesión
     * almacenados localmente (tokens, id de usuario, rol, etc.).
     */
    public void cerrarSesion() {
        Map<String, String> cuerpo = new HashMap<>();
        String tokenRefresh = gestorSesion.obtenerTokenRefresh();
        if (tokenRefresh != null) {
            // El backend (dtoCierreSesion) espera el campo "tokenRefresco".
            cuerpo.put("tokenRefresco", tokenRefresh);
        }
        // Fire-and-forget: aunque falle la llamada al servidor, cerramos sesión local
        servicioApi.cerrarSesion(cuerpo).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> c, Response<Void> r) { }
            @Override public void onFailure(Call<Void> c, Throwable t) { }
        });
        // Cerrar el socket de chat para que no quede autenticado con la cuenta anterior.
        repositorioChat.desconectar();
        gestorSesion.cerrarSesion();
    }

    /**
     * Indica si existe un token de acceso almacenado localmente.
     * Se usa, por ejemplo, para decidir si mostrar la pantalla de login
     * al arrancar la app.
     *
     * @return {@code true} si hay un token de acceso guardado.
     */
    public boolean hayTokenAcceso() {
        return gestorSesion.hayTokenAcceso();
    }

    /**
     * @return el rol del usuario autenticado (p.ej. "cliente", "disenador", "admin"),
     *         obtenido de los datos guardados localmente tras el login.
     */
    public String obtenerRol() {
        return gestorSesion.obtenerUsuarioRol();
    }

    /**
     * @return {@code true} si el usuario ya ha visto la pantalla de onboarding
     *         en una sesión anterior (persistido localmente).
     */
    public boolean onboardingYaVisto() {
        return gestorSesion.onboardingYaVisto();
    }

    /** Marca localmente que el onboarding ya se mostró, para no repetirlo. */
    public void marcarOnboardingVisto() {
        gestorSesion.marcarOnboardingVisto();
    }
}
