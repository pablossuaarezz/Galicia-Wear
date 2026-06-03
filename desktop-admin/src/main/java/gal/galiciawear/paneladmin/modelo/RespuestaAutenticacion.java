package gal.galiciawear.paneladmin.modelo;

/** Respuesta de /auth/login y /auth/refresh. */
public record RespuestaAutenticacion(
        String tokenAcceso,
        String tokenRefresco,
        String expiraEn,
        UsuarioBasico usuario) {
}
