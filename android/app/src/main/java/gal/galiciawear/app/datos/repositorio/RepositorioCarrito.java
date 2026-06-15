package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.local.dao.DaoCarrito;
import gal.galiciawear.app.datos.local.entidad.EntidadItemCarrito;
import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoEnvoltorioCarrito;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionCarritoItem;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaCarrito;
import gal.galiciawear.app.utilidades.RecursoUi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Fuente única de verdad del carrito.
 *
 * El backend manda el carrito completo en cada operación (alta, baja, consulta),
 * así que mantenemos un único {@code estadoCarrito} compartido: cualquier pantalla
 * que lo observe (pestaña Carrito, badge…) se actualiza al instante tras añadir o
 * eliminar desde cualquier otra. Además sincronizamos una caché Room para que el
 * badge de la barra inferior persista entre arranques y refleje las unidades reales.
 *
 * Al ser @Singleton, todas las pantallas comparten esta misma instancia y, por
 * tanto, el mismo estado.
 */
@Singleton
public class RepositorioCarrito {

    private final ServicioApi servicioApi;
    private final DaoCarrito daoCarrito;
    private final ExecutorService ejecutorIo = Executors.newSingleThreadExecutor();

    // Estado compartido del carrito. Eager para que observe() nunca reciba null.
    private final MutableLiveData<RecursoUi<DtoRespuestaCarrito>> estadoCarrito = new MutableLiveData<>();

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para las operaciones de carrito en el backend.
     * @param daoCarrito DAO de Room usado como caché local del carrito (badge persistente).
     */
    @Inject
    public RepositorioCarrito(ServicioApi servicioApi, DaoCarrito daoCarrito) {
        this.servicioApi = servicioApi;
        this.daoCarrito  = daoCarrito;
    }

    /** Número de unidades para el badge (desde Room: persiste y es reactivo). */
    public LiveData<Integer> observarContadorItems() {
        return daoCarrito.contarItems();
    }

    /** Estado compartido del carrito para las pantallas. */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> observarCarrito() {
        return estadoCarrito;
    }

    /**
     * Carga (o recarga) el carrito desde el backend.
     * Actualiza el estado compartido {@code estadoCarrito} (cargando -> éxito/error)
     * y, si la respuesta es correcta, sincroniza la caché local con
     * {@link #publicar(DtoRespuestaCarrito)}.
     */
    public void cargarCarrito() {
        estadoCarrito.postValue(RecursoUi.cargando());
        servicioApi.obtenerCarrito().enqueue(new Callback<DtoEnvoltorioCarrito>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioCarrito> call, Response<DtoEnvoltorioCarrito> r) {
                if (r.isSuccessful() && r.body() != null && r.body().carrito != null) {
                    publicar(r.body().carrito);
                } else {
                    estadoCarrito.postValue(RecursoUi.error("No se pudo cargar el carrito"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioCarrito> call, Throwable t) {
                estadoCarrito.postValue(RecursoUi.error("Sin conexión"));
            }
        });
    }

    /**
     * Añade un artículo (o fija su cantidad: el backend hace upsert).
     * Devuelve un LiveData de un solo uso para que la pantalla muestre feedback;
     * el estado compartido se actualiza por separado para refrescar el carrito.
     */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> añadirItem(String varianteId, int cantidad) {
        MutableLiveData<RecursoUi<DtoRespuestaCarrito>> operacion = new MutableLiveData<>(RecursoUi.cargando());
        servicioApi.añadirItemCarrito(new DtoPeticionCarritoItem(varianteId, cantidad))
            .enqueue(new Callback<DtoEnvoltorioCarrito>() {
                @Override
                public void onResponse(Call<DtoEnvoltorioCarrito> call, Response<DtoEnvoltorioCarrito> r) {
                    if (r.isSuccessful() && r.body() != null && r.body().carrito != null) {
                        publicar(r.body().carrito);
                        operacion.postValue(RecursoUi.exito(r.body().carrito));
                    } else {
                        operacion.postValue(RecursoUi.error("No se pudo añadir al carrito"));
                    }
                }

                @Override
                public void onFailure(Call<DtoEnvoltorioCarrito> call, Throwable t) {
                    operacion.postValue(RecursoUi.error("Sin conexión"));
                }
            });
        return operacion;
    }

    /** Elimina un artículo del carrito y refresca el estado compartido. */
    public LiveData<RecursoUi<DtoRespuestaCarrito>> eliminarItem(String varianteId) {
        MutableLiveData<RecursoUi<DtoRespuestaCarrito>> operacion = new MutableLiveData<>(RecursoUi.cargando());
        servicioApi.eliminarItemCarrito(varianteId).enqueue(new Callback<DtoEnvoltorioCarrito>() {
            @Override
            public void onResponse(Call<DtoEnvoltorioCarrito> call, Response<DtoEnvoltorioCarrito> r) {
                if (r.isSuccessful() && r.body() != null && r.body().carrito != null) {
                    publicar(r.body().carrito);
                    operacion.postValue(RecursoUi.exito(r.body().carrito));
                } else {
                    operacion.postValue(RecursoUi.error("No se pudo eliminar el artículo"));
                }
            }

            @Override
            public void onFailure(Call<DtoEnvoltorioCarrito> call, Throwable t) {
                operacion.postValue(RecursoUi.error("Sin conexión"));
            }
        });
        return operacion;
    }

    /**
     * Tras confirmar un pedido el backend ya vacía el carrito; reflejamos ese
     * vaciado en el estado compartido y en la caché local para que el badge
     * desaparezca de inmediato sin una llamada de red extra.
     */
    public void vaciarTrasPedido() {
        estadoCarrito.postValue(RecursoUi.exito(new DtoRespuestaCarrito()));
        ejecutorIo.execute(daoCarrito::vaciar);
    }

    // ── Privado ────────────────────────────────────────────────────────────

    private void publicar(DtoRespuestaCarrito carrito) {
        estadoCarrito.postValue(RecursoUi.exito(carrito));
        sincronizarLocal(carrito);
    }

    private void sincronizarLocal(DtoRespuestaCarrito carrito) {
        ejecutorIo.execute(() -> {
            List<EntidadItemCarrito> entidades = new ArrayList<>();
            if (carrito.items != null) {
                for (DtoRespuestaCarrito.DtoItemCarrito item : carrito.items) {
                    if (item.variante == null || item.variante.id == null) continue;
                    EntidadItemCarrito entidad = new EntidadItemCarrito();
                    entidad.varianteId = item.variante.id;
                    entidad.cantidad   = item.cantidad;
                    entidad.talla      = item.variante.talla;
                    entidad.color      = item.variante.color;
                    entidad.precio     = item.precioUnitario();
                    if (item.variante.producto != null) {
                        entidad.nombreProducto = item.variante.producto.nombre;
                        entidad.urlImagen      = item.variante.producto.urlImagenPrincipal();
                    }
                    entidades.add(entidad);
                }
            }
            daoCarrito.reemplazar(entidades);
        });
    }
}
