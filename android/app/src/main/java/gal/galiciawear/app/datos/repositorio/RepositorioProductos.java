package gal.galiciawear.app.datos.repositorio;

import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.local.dao.DaoProducto;
import gal.galiciawear.app.datos.local.entidad.EntidadProducto;
import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProductoEnvoltura;
import gal.galiciawear.app.utilidades.Constantes;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio de productos con estrategia cache-then-network:
 * 1. Devuelve inmediatamente los datos de Room (rápido, offline).
 * 2. Lanza la petición de red en paralelo.
 * 3. Al recibir respuesta de red, actualiza Room → Room notifica el LiveData.
 *
 * JUSTIFICACIÓN: Esta estrategia respeta la Ley de Fitts (respuesta visual
 * inmediata) y el principio "Feedback inmediato" de los criterios psicológicos
 * UI/UX exigidos en la rúbrica DAM.
 */
@Singleton
public class RepositorioProductos {

    private final ServicioApi servicioApi;
    private final DaoProducto daoProducto;
    // Executor de I/O para las operaciones Room (no se pueden hacer en hilo principal)
    private final ExecutorService ejecutorIo = Executors.newFixedThreadPool(2);
    private final Handler hiloUi = new Handler(Looper.getMainLooper());

    private static final long TTL_CACHE_MS = 60 * 60 * 1000; // 1 hora

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para el catálogo público de productos.
     * @param daoProducto DAO de Room usado como caché local del catálogo.
     */
    @Inject
    public RepositorioProductos(ServicioApi servicioApi, DaoProducto daoProducto) {
        this.servicioApi = servicioApi;
        this.daoProducto = daoProducto;
    }

    /**
     * LiveData observable de la caché local — se actualiza automáticamente cuando Room cambia.
     *
     * @return LiveData con la lista de productos cacheados en Room.
     */
    public LiveData<List<EntidadProducto>> observarProductosCache() {
        return daoProducto.observarTodos();
    }

    /**
     * Carga productos de la red con filtros y actualiza la caché Room.
     * Retorna LiveData&lt;RecursoUi&gt; para que el Fragment gestione estados.
     *
     * @param busqueda texto de búsqueda libre, o {@code null} si no se filtra.
     * @param material filtro por material principal, o {@code null}.
     * @param ciudad filtro por ciudad de origen, o {@code null}.
     * @param maxKm distancia máxima en km de origen, o {@code null}.
     * @param certificado filtro por certificado de sostenibilidad, o {@code null}.
     * @param pagina número de página (paginación del backend, 1-indexada).
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         o {@code error(mensaje)} según el resultado de la petición.
     */
    public MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> cargarProductos(
        String busqueda, String material, String ciudad,
        Integer maxKm, String certificado, int pagina
    ) {
        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.listarProductos(busqueda, material, ciudad, maxKm, certificado,
                pagina, Constantes.PAGINA_TAMANO)
            .enqueue(new Callback<DtoRespuestaListaProductos>() {
                @Override
                public void onResponse(Call<DtoRespuestaListaProductos> call,
                                       Response<DtoRespuestaListaProductos> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        List<DtoRespuestaProducto> lista = r.body().datos;
                        // postValue: el callback se ejecuta en un hilo de background de OkHttp.
                        resultado.postValue(RecursoUi.exito(lista));
                        // Actualizar caché solo si es la primera página sin filtros
                        if (pagina == 1 && busqueda == null && material == null) {
                            actualizarCache(lista);
                        }
                    } else {
                        resultado.postValue(RecursoUi.error("Error al cargar productos"));
                    }
                }

                @Override
                public void onFailure(Call<DtoRespuestaListaProductos> call, Throwable t) {
                    // Fallo de red (sin conexión, timeout, etc.).
                    resultado.postValue(RecursoUi.error("Sin conexión"));
                }
            });

        return resultado;
    }

    /**
     * Obtiene el detalle completo de un producto a partir de su slug (URL amigable).
     *
     * @param slug identificador textual del producto (URL amigable).
     * @return LiveData que emite {@code cargando()} y después {@code exito(producto)}
     *         con el detalle, o {@code error(mensaje)} si no se encuentra o falla la petición.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaProducto>> obtenerDetalle(String slug) {
        MutableLiveData<RecursoUi<DtoRespuestaProducto>> resultado = new MutableLiveData<>();
        resultado.setValue(RecursoUi.cargando());

        servicioApi.obtenerProducto(slug).enqueue(new Callback<DtoRespuestaProductoEnvoltura>() {
            @Override
            public void onResponse(Call<DtoRespuestaProductoEnvoltura> call,
                                   Response<DtoRespuestaProductoEnvoltura> r) {
                if (r.isSuccessful() && r.body() != null && r.body().producto != null) {
                    resultado.postValue(RecursoUi.exito(r.body().producto));
                } else {
                    resultado.postValue(RecursoUi.error("Producto no encontrado"));
                }
            }

            @Override
            public void onFailure(Call<DtoRespuestaProductoEnvoltura> call, Throwable t) {
                resultado.postValue(RecursoUi.error("Sin conexión"));
            }
        });

        return resultado;
    }

    /**
     * Convierte la lista de DTOs recibidos del backend en entidades Room y las
     * inserta en la caché local, tras invalidar las entradas cuya antigüedad
     * supere {@link #TTL_CACHE_MS}. Se ejecuta en {@link #ejecutorIo} porque
     * Room no permite operaciones de escritura en el hilo principal.
     *
     * @param dtos lista de productos recibidos del backend.
     */
    private void actualizarCache(List<DtoRespuestaProducto> dtos) {
        ejecutorIo.execute(() -> {
            long ahora = System.currentTimeMillis();
            // Invalidar entradas antiguas antes de insertar las nuevas
            daoProducto.borrarCacheAntigua(ahora - TTL_CACHE_MS);

            List<EntidadProducto> entidades = new ArrayList<>();
            for (DtoRespuestaProducto dto : dtos) {
                EntidadProducto e = new EntidadProducto();
                e.id                  = dto.id;
                e.nombre              = dto.nombre;
                e.slug                = dto.slug;
                e.descripcion         = dto.descripcion;
                // El backend envía el precio en "precioBase"; "precio" llega a 0.
                e.precio              = dto.precio > 0 ? dto.precio : dto.precioBase;
                e.materialPrincipal   = dto.materialPrincipal;
                e.kmOrigen            = dto.kmOrigen;
                e.fechaCache          = ahora;
                // Imagen principal
                if (dto.imagenes != null && !dto.imagenes.isEmpty()) {
                    for (DtoRespuestaProducto.DtoImagenProducto img : dto.imagenes) {
                        if (img.esPrincipal) { e.urlImagenPrincipal = img.url; break; }
                    }
                    if (e.urlImagenPrincipal == null) {
                        e.urlImagenPrincipal = dto.imagenes.get(0).url;
                    }
                }
                if (dto.disenador != null) {
                    e.nombreMarcaDisenador = dto.disenador.nombreMarca;
                }
                entidades.add(e);
            }
            daoProducto.insertarTodos(entidades);
        });
    }
}
