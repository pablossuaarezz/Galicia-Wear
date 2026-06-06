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

    @Inject
    public RepositorioProductos(ServicioApi servicioApi, DaoProducto daoProducto) {
        this.servicioApi = servicioApi;
        this.daoProducto = daoProducto;
    }

    /** LiveData observable de la caché local — se actualiza automáticamente cuando Room cambia */
    public LiveData<List<EntidadProducto>> observarProductosCache() {
        return daoProducto.observarTodos();
    }

    /**
     * Carga productos de la red con filtros y actualiza la caché Room.
     * Retorna LiveData<RecursoUi> para que el Fragment gestione estados.
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
                    resultado.postValue(RecursoUi.error("Sin conexión"));
                }
            });

        return resultado;
    }

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
