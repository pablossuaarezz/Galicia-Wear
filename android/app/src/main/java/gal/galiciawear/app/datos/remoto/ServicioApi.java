package gal.galiciawear.app.datos.remoto;

import java.util.List;

import gal.galiciawear.app.datos.remoto.dto.DtoPeticionCarritoItem;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionLogin;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionRegistro;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaPedido;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaToken;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaUsuario;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
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
    Call<DtoRespuestaProducto> obtenerProducto(@Path("slug") String slug);

    // ── Carrito ──────────────────────────────────────────────────────────────

    @GET("carrito")
    Call<DtoRespuestaCarrito> obtenerCarrito();

    @POST("carrito/items")
    Call<DtoRespuestaCarrito> añadirItemCarrito(@Body DtoPeticionCarritoItem cuerpo);

    @DELETE("carrito/items/{varianteId}")
    Call<DtoRespuestaCarrito> eliminarItemCarrito(@Path("varianteId") String varianteId);

    @DELETE("carrito")
    Call<Void> vaciarCarrito();

    // ── Pedidos ──────────────────────────────────────────────────────────────

    @POST("pedidos")
    Call<DtoRespuestaPedido> crearPedido(@Body DtoPeticionPedido cuerpo);

    @GET("pedidos")
    Call<List<DtoRespuestaPedido>> listarPedidos();

    @GET("pedidos/{id}")
    Call<DtoRespuestaPedido> obtenerPedido(@Path("id") String id);

    @PATCH("pedidos/{id}/pagar")
    Call<DtoRespuestaPedido> pagarPedido(@Path("id") String id);

    @PATCH("pedidos/{id}/cancelar")
    Call<DtoRespuestaPedido> cancelarPedido(@Path("id") String id);
}
