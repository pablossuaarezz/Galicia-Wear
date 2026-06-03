package gal.galiciawear.paneladmin.servicio;

import com.fasterxml.jackson.databind.JsonNode;
import gal.galiciawear.paneladmin.configuracion.GestorSesion;
import gal.galiciawear.paneladmin.modelo.RespuestaAutenticacion;
import gal.galiciawear.paneladmin.modelo.UsuarioBasico;

/** Autenticación: login (solo ADMIN) y logout. */
public class ServicioAutenticacion extends ServicioBase {

    private final GestorSesion sesion;

    public ServicioAutenticacion(ClienteHttp http, GestorSesion sesion) {
        super(http);
        this.sesion = sesion;
    }

    /**
     * Inicia sesión. Si las credenciales son válidas pero el rol no es ADMIN, rechaza el acceso
     * (el panel es exclusivo para administradores). Persiste la sesión si todo es correcto.
     */
    public UsuarioBasico iniciarSesion(String correo, String contrasena) {
        String cuerpo = Json.escribir(new Credenciales(correo, contrasena));
        RespuestaHttp respuesta = http.post("/auth/login", cuerpo);
        if (respuesta.codigo() == 401) {
            throw new ErrorApi(401, "Correo o contraseña incorrectos");
        }
        exigirExito(respuesta);

        RespuestaAutenticacion datos = Json.convertir(Json.leerArbol(respuesta.cuerpo()), RespuestaAutenticacion.class);
        UsuarioBasico usuario = datos.usuario();
        if (usuario == null || !"ADMIN".equals(usuario.rol())) {
            throw new ErrorApi(403, "Esta cuenta no tiene permisos de administrador");
        }
        sesion.guardarSesion(datos.tokenAcceso(), datos.tokenRefresco(),
                usuario.id(), usuario.correo(), usuario.rol());
        return usuario;
    }

    /** Cierra la sesión: revoca el refresco en el servidor (best-effort) y limpia el almacén local. */
    public void cerrarSesion() {
        String refresco = sesion.getTokenRefresco();
        if (refresco != null) {
            try {
                http.post("/auth/logout", "{\"tokenRefresco\":\"" + refresco + "\"}");
            } catch (ErrorApi ignorado) {
                // El logout es idempotente; si el servidor no responde limpiamos igualmente.
            }
        }
        sesion.limpiar();
    }

    /** Comprueba contra /auth/yo que la sesión almacenada sigue siendo válida y es ADMIN. */
    public boolean sesionVigenteEsAdmin() {
        if (!sesion.estaAutenticado()) {
            return false;
        }
        RespuestaHttp respuesta = http.get("/auth/yo");
        if (!respuesta.exito()) {
            return false;
        }
        JsonNode nodo = Json.leerArbol(respuesta.cuerpo());
        return "ADMIN".equals(nodo.path("rol").asText(null));
    }

    private record Credenciales(String correo, String contrasena) {
    }
}
