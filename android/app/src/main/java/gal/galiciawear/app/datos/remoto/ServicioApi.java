package gal.galiciawear.app.datos.remoto;

import java.util.List;

import gal.galiciawear.app.datos.remoto.dto.DtoPeticionActualizarPerfil;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionCarritoItem;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionLogin;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionPublicar;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionRegistro;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionVariante;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioCarrito;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioConversaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioDireccion;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioListaDirecciones;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioListaPedidos;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioNotificaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoContadorNotificaciones;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionTokenFcm;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaDisenador;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaImagenes;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaVariantes;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProductoEnvoltura;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * Interfaz Retrofit que mapea los endpoints de la API REST GaliciaWear.
 * Retrofit genera la implementación en tiempo de compilación, sin reflexión
 * en tiempo de ejecución — esto es más eficiente y fácil de testear con mocks.
 */
public interface ServicioApi {

    // ── Autenticación ────────────────────────────────────────────────────────

    @POST("auth/registro")
    Call<DtoRespuestaToken> registro(@Body DtoPeticionRegistro cuerpo);

    @POST("auth/login")
    Call<DtoRespuestaToken> login(@Body DtoPeticionLogin cuerpo);

    @POST("auth/refresh")
    Call<DtoRespuestaToken> refrescarToken(@Body java.util.Map<String, String> cuerpo);

    @POST("auth/logout")
    Call<Void> cerrarSesion(@Body java.util.Map<String, String> cuerpo);

    @GET("auth/yo")
    Call<DtoRespuestaUsuario> obtenerPerfil();

    @PATCH("usuarios/yo/cliente")
    Call<Void> actualizarPerfilCliente(@Body DtoPeticionActualizarPerfil cuerpo);

    // ── Productos ────────────────────────────────────────────────────────────

    @GET("productos")
    Call<DtoRespuestaListaProductos> listarProductos(
        @Query("busqueda")      String busqueda,
        @Query("material")      String material,
        @Query("ciudad")        String ciudad,
        @Query("maxKm")         Integer maxKm,
        @Query("certificado")   String certificado,
        @Query("pagina")        int pagina,
        @Query("tamano")        int tamano
    );

    @GET("productos/{slug}")
    Call<DtoRespuestaProductoEnvoltura> obtenerProducto(@Path("slug") String slug);

    // ── Carrito ──────────────────────────────────────────────────────────────
    // El backend responde envuelto en { "carrito": {...} } en GET/POST/DELETE.

    @GET("carrito")
    Call<DtoEnvoltorioCarrito> obtenerCarrito();

    @POST("carrito/items")
    Call<DtoEnvoltorioCarrito> añadirItemCarrito(@Body DtoPeticionCarritoItem cuerpo);

    @DELETE("carrito/items/{varianteId}")
    Call<DtoEnvoltorioCarrito> eliminarItemCarrito(@Path("varianteId") String varianteId);

    @DELETE("carrito")
    Call<Void> vaciarCarrito();

    // ── Direcciones ──────────────────────────────────────────────────────────

    @GET("direcciones")
    Call<DtoEnvoltorioListaDirecciones> listarDirecciones();

    @POST("direcciones")
    Call<DtoEnvoltorioDireccion> crearDireccion(@Body DtoPeticionDireccion cuerpo);

    // ── Pedidos ──────────────────────────────────────────────────────────────

    @POST("pedidos")
    Call<DtoEnvoltorioPedido> crearPedido(@Body DtoPeticionPedido cuerpo);

    @GET("pedidos")
    Call<DtoEnvoltorioListaPedidos> listarPedidos();

    @GET("pedidos/{id}")
    Call<DtoEnvoltorioPedido> obtenerPedido(@Path("id") String id);

    @PATCH("pedidos/{id}/pagar")
    Call<DtoRespuestaPedido> pagarPedido(@Path("id") String id);

    @PATCH("pedidos/{id}/cancelar")
    Call<DtoRespuestaPedido> cancelarPedido(@Path("id") String id);

    // ── Diseñador (perfil de marca) ──────────────────────────────────────────

    @GET("disenadores/yo")
    Call<DtoRespuestaDisenador> obtenerMiPerfilDisenador();

    @POST("disenadores/solicitar")
    Call<DtoRespuestaDisenador> solicitarPerfilDisenador(@Body DtoPeticionDisenador cuerpo);

    @PATCH("disenadores/yo")
    Call<DtoRespuestaDisenador> actualizarPerfilDisenador(@Body DtoPeticionDisenador cuerpo);

    // ── Prendas del diseñador (productos propios) ────────────────────────────

    @GET("productos/mios")
    Call<DtoRespuestaListaProductos> listarMisPrendas();

    @GET("productos/mios/{id}")
    Call<DtoRespuestaProductoEnvoltura> obtenerMiPrenda(@Path("id") String id);

    @POST("productos")
    Call<DtoRespuestaProductoEnvoltura> crearPrenda(@Body DtoPeticionProducto cuerpo);

    @PATCH("productos/{id}")
    Call<DtoRespuestaProductoEnvoltura> actualizarPrenda(
        @Path("id") String id, @Body DtoPeticionProducto cuerpo);

    @PATCH("productos/{id}")
    Call<DtoRespuestaProductoEnvoltura> publicarPrenda(
        @Path("id") String id, @Body DtoPeticionPublicar cuerpo);

    @DELETE("productos/{id}")
    Call<Void> eliminarPrenda(@Path("id") String id);

    // ── Variantes de una prenda ──────────────────────────────────────────────

    @GET("productos/{productoId}/variantes")
    Call<DtoRespuestaListaVariantes> listarVariantes(@Path("productoId") String productoId);

    @POST("productos/{productoId}/variantes")
    Call<Void> crearVariante(
        @Path("productoId") String productoId, @Body DtoPeticionVariante cuerpo);

    @DELETE("productos/{productoId}/variantes/{id}")
    Call<Void> eliminarVariante(
        @Path("productoId") String productoId, @Path("id") String id);

    // ── Fotos de una prenda (URL en SQL) ─────────────────────────────────────

    @GET("productos/{productoId}/imagenes")
    Call<DtoRespuestaListaImagenes> listarImagenes(@Path("productoId") String productoId);

    @POST("productos/{productoId}/imagenes")
    Call<Void> crearImagen(
        @Path("productoId") String productoId, @Body DtoPeticionImagen cuerpo);

    @PATCH("productos/{productoId}/imagenes/{id}/principal")
    Call<Void> marcarImagenPrincipal(
        @Path("productoId") String productoId, @Path("id") String id);

    @DELETE("productos/{productoId}/imagenes/{id}")
    Call<Void> eliminarImagen(
        @Path("productoId") String productoId, @Path("id") String id);

    // ── Chat de soporte (bandeja) ────────────────────────────────────────────
    // El tiempo real va por Socket.IO; estos endpoints REST son para la bandeja.

    @GET("chat/conversaciones")
    Call<DtoEnvoltorioConversaciones> listarConversaciones();

    @PATCH("chat/{peerId}/leer")
    Call<Void> marcarConversacionLeida(@Path("peerId") String peerId);

    // ── Notificaciones (bandeja in-app) ──────────────────────────────────────
    // El tiempo real va por Socket.IO ("nueva_notificacion"); estos endpoints son
    // para el historial, el contador del badge y marcar leídas.

    @GET("notificaciones")
    Call<DtoEnvoltorioNotificaciones> listarNotificaciones(
        @Query("pagina") int pagina, @Query("limite") int limite);

    @GET("notificaciones/contador")
    Call<DtoContadorNotificaciones> contadorNotificaciones();

    @PATCH("notificaciones/{id}/leer")
    Call<Void> marcarNotificacionLeida(@Path("id") String id);

    @PATCH("notificaciones/leer-todas")
    Call<Void> marcarTodasNotificacionesLeidas();

    // ── Push FCM (best-effort) ───────────────────────────────────────────────

    @PUT("usuarios/yo/fcm-token")
    Call<Void> registrarTokenFcm(@Body DtoPeticionTokenFcm cuerpo);
}
