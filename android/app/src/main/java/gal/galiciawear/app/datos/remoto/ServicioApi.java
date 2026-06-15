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

    /**
     * {@code POST auth/registro}: registra un nuevo usuario en la plataforma.
     *
     * @param cuerpo datos del nuevo usuario (correo, contraseña, nombre, apellidos, rol).
     * @return tokens de sesión y perfil del usuario recién creado.
     */
    @POST("auth/registro")
    Call<DtoRespuestaToken> registro(@Body DtoPeticionRegistro cuerpo);

    /**
     * {@code POST auth/login}: autentica a un usuario existente.
     *
     * @param cuerpo credenciales de acceso (correo y contraseña).
     * @return tokens de sesión (acceso y refresco) y perfil del usuario autenticado.
     */
    @POST("auth/login")
    Call<DtoRespuestaToken> login(@Body DtoPeticionLogin cuerpo);

    /**
     * {@code POST auth/refresh}: renueva el token de acceso usando el token de refresco.
     * Es invocado automáticamente por {@link InterceptorJwt} cuando una petición
     * autenticada recibe un 401 por token caducado.
     *
     * @param cuerpo mapa con la clave "tokenRefresco" y el valor del refresh token.
     * @return nuevos tokens de acceso (y, opcionalmente, de refresco).
     */
    @POST("auth/refresh")
    Call<DtoRespuestaToken> refrescarToken(@Body java.util.Map<String, String> cuerpo);

    /**
     * {@code POST auth/logout}: invalida la sesión actual en el backend.
     *
     * @param cuerpo mapa con el refresh token a revocar.
     * @return respuesta vacía.
     */
    @POST("auth/logout")
    Call<Void> cerrarSesion(@Body java.util.Map<String, String> cuerpo);

    /**
     * {@code GET auth/yo}: obtiene el perfil del usuario autenticado (requiere token).
     *
     * @return datos del perfil del usuario actual.
     */
    @GET("auth/yo")
    Call<DtoRespuestaUsuario> obtenerPerfil();

    /**
     * {@code PATCH usuarios/yo/cliente}: actualiza los datos de perfil del cliente autenticado.
     *
     * @param cuerpo campos del perfil a actualizar (actualización parcial).
     * @return respuesta vacía.
     */
    @PATCH("usuarios/yo/cliente")
    Call<Void> actualizarPerfilCliente(@Body DtoPeticionActualizarPerfil cuerpo);

    // ── Productos ────────────────────────────────────────────────────────────

    /**
     * {@code GET productos}: lista los productos publicados, con filtros opcionales
     * y paginación.
     *
     * @param busqueda    texto de búsqueda libre (nombre/descripción), o null para no filtrar.
     * @param material    filtra por material principal, o null para no filtrar.
     * @param ciudad      filtra por ciudad del diseñador, o null para no filtrar.
     * @param maxKm       filtra por kilómetros de origen máximos, o null para no filtrar.
     * @param certificado filtra por código de certificado de sostenibilidad, o null para no filtrar.
     * @param pagina      número de página solicitada.
     * @param tamano      número de elementos por página.
     * @return página de productos que cumplen los filtros, junto con metadatos de paginación.
     */
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

    /**
     * {@code GET productos/{slug}}: obtiene la ficha completa de un producto público.
     *
     * @param slug identificador legible del producto en la URL.
     * @return el producto envuelto en {@code { "producto": {...} } }.
     */
    @GET("productos/{slug}")
    Call<DtoRespuestaProductoEnvoltura> obtenerProducto(@Path("slug") String slug);

    // ── Carrito ──────────────────────────────────────────────────────────────
    // El backend responde envuelto en { "carrito": {...} } en GET/POST/DELETE.

    /**
     * {@code GET carrito}: obtiene el carrito del usuario autenticado.
     *
     * @return el carrito envuelto en {@code { "carrito": {...} } }.
     */
    @GET("carrito")
    Call<DtoEnvoltorioCarrito> obtenerCarrito();

    /**
     * {@code POST carrito/items}: añade una variante de producto al carrito (o
     * incrementa su cantidad si ya estaba presente).
     *
     * @param cuerpo identificador de la variante y cantidad a añadir.
     * @return el carrito actualizado envuelto en {@code { "carrito": {...} } }.
     */
    @POST("carrito/items")
    Call<DtoEnvoltorioCarrito> añadirItemCarrito(@Body DtoPeticionCarritoItem cuerpo);

    /**
     * {@code DELETE carrito/items/{varianteId}}: elimina del carrito la línea
     * correspondiente a la variante indicada.
     *
     * @param varianteId identificador de la variante a eliminar del carrito.
     * @return el carrito actualizado envuelto en {@code { "carrito": {...} } }.
     */
    @DELETE("carrito/items/{varianteId}")
    Call<DtoEnvoltorioCarrito> eliminarItemCarrito(@Path("varianteId") String varianteId);

    /**
     * {@code DELETE carrito}: vacía por completo el carrito del usuario autenticado.
     *
     * @return respuesta vacía.
     */
    @DELETE("carrito")
    Call<Void> vaciarCarrito();

    // ── Direcciones ──────────────────────────────────────────────────────────

    /**
     * {@code GET direcciones}: lista las direcciones de envío guardadas por el usuario.
     *
     * @return lista de direcciones del usuario.
     */
    @GET("direcciones")
    Call<DtoEnvoltorioListaDirecciones> listarDirecciones();

    /**
     * {@code POST direcciones}: crea una nueva dirección de envío para el usuario.
     *
     * @param cuerpo datos de la nueva dirección.
     * @return la dirección creada.
     */
    @POST("direcciones")
    Call<DtoEnvoltorioDireccion> crearDireccion(@Body DtoPeticionDireccion cuerpo);

    // ── Pedidos ──────────────────────────────────────────────────────────────

    /**
     * {@code POST pedidos}: crea un nuevo pedido a partir del carrito actual
     * (checkout).
     *
     * @param cuerpo datos necesarios para el pedido (dirección, método de pago, etc.).
     * @return el pedido creado.
     */
    @POST("pedidos")
    Call<DtoEnvoltorioPedido> crearPedido(@Body DtoPeticionPedido cuerpo);

    /**
     * {@code GET pedidos}: lista el historial de pedidos del usuario autenticado.
     *
     * @return lista de pedidos del usuario.
     */
    @GET("pedidos")
    Call<DtoEnvoltorioListaPedidos> listarPedidos();

    /**
     * {@code GET pedidos/{id}}: obtiene el detalle de un pedido concreto.
     *
     * @param id identificador del pedido.
     * @return el pedido solicitado.
     */
    @GET("pedidos/{id}")
    Call<DtoEnvoltorioPedido> obtenerPedido(@Path("id") String id);

    /**
     * {@code PATCH pedidos/{id}/pagar}: marca un pedido como pagado.
     *
     * @param id identificador del pedido a pagar.
     * @return el pedido actualizado con su nuevo estado.
     */
    @PATCH("pedidos/{id}/pagar")
    Call<DtoRespuestaPedido> pagarPedido(@Path("id") String id);

    /**
     * {@code PATCH pedidos/{id}/cancelar}: cancela un pedido.
     *
     * @param id identificador del pedido a cancelar.
     * @return el pedido actualizado con su nuevo estado.
     */
    @PATCH("pedidos/{id}/cancelar")
    Call<DtoRespuestaPedido> cancelarPedido(@Path("id") String id);

    // ── Diseñador (perfil de marca) ──────────────────────────────────────────

    /**
     * {@code GET disenadores/yo}: obtiene el perfil de diseñador (marca) del
     * usuario autenticado.
     *
     * @return el perfil de diseñador envuelto en {@code { "disenador": {...} } }.
     */
    @GET("disenadores/yo")
    Call<DtoRespuestaDisenador> obtenerMiPerfilDisenador();

    /**
     * {@code POST disenadores/solicitar}: solicita la conversión del usuario
     * autenticado en diseñador, creando su perfil de marca.
     *
     * @param cuerpo datos del perfil de diseñador solicitado.
     * @return el perfil de diseñador creado, envuelto en {@code { "disenador": {...} } }.
     */
    @POST("disenadores/solicitar")
    Call<DtoRespuestaDisenador> solicitarPerfilDisenador(@Body DtoPeticionDisenador cuerpo);

    /**
     * {@code PATCH disenadores/yo}: actualiza el perfil de diseñador (marca) del
     * usuario autenticado.
     *
     * @param cuerpo campos del perfil de diseñador a actualizar.
     * @return el perfil de diseñador actualizado, envuelto en {@code { "disenador": {...} } }.
     */
    @PATCH("disenadores/yo")
    Call<DtoRespuestaDisenador> actualizarPerfilDisenador(@Body DtoPeticionDisenador cuerpo);

    // ── Prendas del diseñador (productos propios) ────────────────────────────

    /**
     * {@code GET productos/mios}: lista todas las prendas (activas e inactivas)
     * del diseñador autenticado.
     *
     * @return página de prendas propias del diseñador.
     */
    @GET("productos/mios")
    Call<DtoRespuestaListaProductos> listarMisPrendas();

    /**
     * {@code GET productos/mios/{id}}: obtiene el detalle de una prenda propia
     * del diseñador, incluso si está despublicada.
     *
     * @param id identificador de la prenda.
     * @return la prenda envuelta en {@code { "producto": {...} } }.
     */
    @GET("productos/mios/{id}")
    Call<DtoRespuestaProductoEnvoltura> obtenerMiPrenda(@Path("id") String id);

    /**
     * {@code POST productos}: crea una nueva prenda para el diseñador autenticado.
     *
     * @param cuerpo datos de la nueva prenda.
     * @return la prenda creada, envuelta en {@code { "producto": {...} } }.
     */
    @POST("productos")
    Call<DtoRespuestaProductoEnvoltura> crearPrenda(@Body DtoPeticionProducto cuerpo);

    /**
     * {@code PATCH productos/{id}}: actualiza los datos de una prenda existente.
     *
     * @param id     identificador de la prenda a actualizar.
     * @param cuerpo nuevos datos de la prenda.
     * @return la prenda actualizada, envuelta en {@code { "producto": {...} } }.
     */
    @PATCH("productos/{id}")
    Call<DtoRespuestaProductoEnvoltura> actualizarPrenda(
        @Path("id") String id, @Body DtoPeticionProducto cuerpo);

    /**
     * {@code PATCH productos/{id}}: publica o despublica una prenda, enviando
     * solo el campo {@code activo} (actualización parcial). Comparte ruta con
     * {@link #actualizarPrenda} pero con un cuerpo distinto.
     *
     * @param id     identificador de la prenda.
     * @param cuerpo nuevo estado de publicación de la prenda.
     * @return la prenda actualizada, envuelta en {@code { "producto": {...} } }.
     */
    @PATCH("productos/{id}")
    Call<DtoRespuestaProductoEnvoltura> publicarPrenda(
        @Path("id") String id, @Body DtoPeticionPublicar cuerpo);

    /**
     * {@code DELETE productos/{id}}: elimina una prenda del diseñador.
     *
     * @param id identificador de la prenda a eliminar.
     * @return respuesta vacía.
     */
    @DELETE("productos/{id}")
    Call<Void> eliminarPrenda(@Path("id") String id);

    // ── Variantes de una prenda ──────────────────────────────────────────────

    /**
     * {@code GET productos/{productoId}/variantes}: lista las variantes
     * (talla/color) de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @return lista de variantes envuelta en {@code { "variantes": [...] } }.
     */
    @GET("productos/{productoId}/variantes")
    Call<DtoRespuestaListaVariantes> listarVariantes(@Path("productoId") String productoId);

    /**
     * {@code POST productos/{productoId}/variantes}: crea una nueva variante
     * (talla/color) para una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param cuerpo     datos de la nueva variante.
     * @return respuesta vacía.
     */
    @POST("productos/{productoId}/variantes")
    Call<Void> crearVariante(
        @Path("productoId") String productoId, @Body DtoPeticionVariante cuerpo);

    /**
     * {@code DELETE productos/{productoId}/variantes/{id}}: elimina una variante
     * de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id         identificador de la variante a eliminar.
     * @return respuesta vacía.
     */
    @DELETE("productos/{productoId}/variantes/{id}")
    Call<Void> eliminarVariante(
        @Path("productoId") String productoId, @Path("id") String id);

    // ── Fotos de una prenda (URL en SQL) ─────────────────────────────────────

    /**
     * {@code GET productos/{productoId}/imagenes}: lista las imágenes asociadas
     * a una prenda.
     *
     * @param productoId identificador de la prenda.
     * @return lista de imágenes envuelta en {@code { "imagenes": [...] } }.
     */
    @GET("productos/{productoId}/imagenes")
    Call<DtoRespuestaListaImagenes> listarImagenes(@Path("productoId") String productoId);

    /**
     * {@code POST productos/{productoId}/imagenes}: añade una nueva imagen
     * (por URL) a una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param cuerpo     datos de la nueva imagen (URL, texto alternativo, etc.).
     * @return respuesta vacía.
     */
    @POST("productos/{productoId}/imagenes")
    Call<Void> crearImagen(
        @Path("productoId") String productoId, @Body DtoPeticionImagen cuerpo);

    /**
     * {@code PATCH productos/{productoId}/imagenes/{id}/principal}: marca una
     * imagen como la imagen principal de la prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id         identificador de la imagen a marcar como principal.
     * @return respuesta vacía.
     */
    @PATCH("productos/{productoId}/imagenes/{id}/principal")
    Call<Void> marcarImagenPrincipal(
        @Path("productoId") String productoId, @Path("id") String id);

    /**
     * {@code DELETE productos/{productoId}/imagenes/{id}}: elimina una imagen
     * de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id         identificador de la imagen a eliminar.
     * @return respuesta vacía.
     */
    @DELETE("productos/{productoId}/imagenes/{id}")
    Call<Void> eliminarImagen(
        @Path("productoId") String productoId, @Path("id") String id);

    // ── Chat de soporte (bandeja) ────────────────────────────────────────────
    // El tiempo real va por Socket.IO; estos endpoints REST son para la bandeja.

    /**
     * {@code GET chat/conversaciones}: lista las conversaciones de chat del
     * usuario autenticado (bandeja de mensajes).
     *
     * @return lista de conversaciones envuelta en {@code { "conversaciones": [...] } }.
     */
    @GET("chat/conversaciones")
    Call<DtoEnvoltorioConversaciones> listarConversaciones();

    /**
     * {@code PATCH chat/{peerId}/leer}: marca como leídos todos los mensajes de
     * la conversación con el usuario indicado.
     *
     * @param peerId identificador del interlocutor de la conversación.
     * @return respuesta vacía.
     */
    @PATCH("chat/{peerId}/leer")
    Call<Void> marcarConversacionLeida(@Path("peerId") String peerId);

    // ── Notificaciones (bandeja in-app) ──────────────────────────────────────
    // El tiempo real va por Socket.IO ("nueva_notificacion"); estos endpoints son
    // para el historial, el contador del badge y marcar leídas.

    /**
     * {@code GET notificaciones}: lista el historial de notificaciones del
     * usuario autenticado, paginado.
     *
     * @param pagina  número de página solicitada.
     * @param limite  número máximo de notificaciones por página.
     * @return lista de notificaciones envuelta en {@code { "notificaciones": [...] } }.
     */
    @GET("notificaciones")
    Call<DtoEnvoltorioNotificaciones> listarNotificaciones(
        @Query("pagina") int pagina, @Query("limite") int limite);

    /**
     * {@code GET notificaciones/contador}: obtiene el número de notificaciones
     * sin leer del usuario, usado para el badge de la interfaz.
     *
     * @return contador de notificaciones no leídas.
     */
    @GET("notificaciones/contador")
    Call<DtoContadorNotificaciones> contadorNotificaciones();

    /**
     * {@code PATCH notificaciones/{id}/leer}: marca una notificación concreta
     * como leída.
     *
     * @param id identificador de la notificación.
     * @return respuesta vacía.
     */
    @PATCH("notificaciones/{id}/leer")
    Call<Void> marcarNotificacionLeida(@Path("id") String id);

    /**
     * {@code PATCH notificaciones/leer-todas}: marca todas las notificaciones del
     * usuario autenticado como leídas.
     *
     * @return respuesta vacía.
     */
    @PATCH("notificaciones/leer-todas")
    Call<Void> marcarTodasNotificacionesLeidas();

    // ── Push FCM (best-effort) ───────────────────────────────────────────────

    /**
     * {@code PUT usuarios/yo/fcm-token}: registra (o actualiza) el token de
     * notificaciones push de Firebase Cloud Messaging del dispositivo actual,
     * asociándolo al usuario autenticado.
     *
     * @param cuerpo token FCM del dispositivo y plataforma ("android").
     * @return respuesta vacía.
     */
    @PUT("usuarios/yo/fcm-token")
    Call<Void> registrarTokenFcm(@Body DtoPeticionTokenFcm cuerpo);
}
