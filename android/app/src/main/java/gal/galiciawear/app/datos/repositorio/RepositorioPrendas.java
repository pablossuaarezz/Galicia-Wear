package gal.galiciawear.app.datos.repositorio;

import androidx.lifecycle.MutableLiveData;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import gal.galiciawear.app.datos.remoto.ServicioApi;
import gal.galiciawear.app.datos.remoto.dto.DtoImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionImagen;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionPublicar;
import gal.galiciawear.app.datos.remoto.dto.DtoPeticionVariante;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaImagenes;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaProductos;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaListaVariantes;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProducto;
import gal.galiciawear.app.datos.remoto.dto.DtoRespuestaProductoEnvoltura;
import gal.galiciawear.app.datos.remoto.dto.DtoVariante;
import gal.galiciawear.app.utilidades.RecursoUi;
import gal.galiciawear.app.utilidades.RespuestasApi;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repositorio de prendas (productos) del diseñador: catálogo propio, alta/edición,
 * variantes (talla/color/stock) y fotos (guardadas en SQL como URL).
 *
 * Reutiliza los endpoints REST ya existentes en el backend (todos `soloDisenador`,
 * con verificación de propiedad). Los métodos devuelven LiveData<RecursoUi<…>>
 * siguiendo el mismo patrón que el resto de repositorios.
 */
@Singleton
public class RepositorioPrendas {

    private final ServicioApi servicioApi;

    /**
     * Constructor inyectado por Hilt.
     *
     * @param servicioApi cliente Retrofit para los endpoints de gestión de prendas del diseñador.
     */
    @Inject
    public RepositorioPrendas(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    // ── Prendas ───────────────────────────────────────────────────────────────

    /**
     * Obtiene el catálogo de prendas (productos) propio del diseñador autenticado.
     *
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         con las prendas, o {@code error(mensaje)} si falla la petición.
     */
    public MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> listarMisPrendas() {
        MutableLiveData<RecursoUi<List<DtoRespuestaProducto>>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.listarMisPrendas().enqueue(new Callback<DtoRespuestaListaProductos>() {
            @Override
            public void onResponse(Call<DtoRespuestaListaProductos> c,
                                   Response<DtoRespuestaListaProductos> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().datos));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoRespuestaListaProductos> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /**
     * Obtiene el detalle de una prenda propia del diseñador.
     *
     * @param id identificador de la prenda/producto.
     * @return LiveData que emite {@code cargando()} y después {@code exito(producto)}
     *         o {@code error(mensaje)} según el resultado.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaProducto>> obtenerMiPrenda(String id) {
        MutableLiveData<RecursoUi<DtoRespuestaProducto>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.obtenerMiPrenda(id).enqueue(new Callback<DtoRespuestaProductoEnvoltura>() {
            @Override
            public void onResponse(Call<DtoRespuestaProductoEnvoltura> c,
                                   Response<DtoRespuestaProductoEnvoltura> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().producto));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoRespuestaProductoEnvoltura> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /**
     * Crea o actualiza una prenda según si se proporciona un identificador.
     *
     * @param id identificador de la prenda a actualizar, o {@code null} para crear una nueva.
     * @param cuerpo datos de la prenda (nombre, descripción, precio, etc.).
     * @return LiveData que emite {@code cargando()} y después {@code exito(producto)}
     *         con la prenda creada/actualizada, o {@code error(mensaje)} si falla.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaProducto>> guardarPrenda(
        String id, DtoPeticionProducto cuerpo) {
        MutableLiveData<RecursoUi<DtoRespuestaProducto>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        // Si id es null se trata de un alta (POST); si no, de una edición (PATCH/PUT).
        Call<DtoRespuestaProductoEnvoltura> llamada = (id == null)
            ? servicioApi.crearPrenda(cuerpo)
            : servicioApi.actualizarPrenda(id, cuerpo);
        llamada.enqueue(new Callback<DtoRespuestaProductoEnvoltura>() {
            @Override
            public void onResponse(Call<DtoRespuestaProductoEnvoltura> c,
                                   Response<DtoRespuestaProductoEnvoltura> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().producto));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoRespuestaProductoEnvoltura> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /**
     * Elimina una prenda del catálogo del diseñador.
     *
     * @param id identificador de la prenda a eliminar.
     * @return LiveData con {@code exito(true)} si se eliminó correctamente,
     *         o {@code error(mensaje)} en caso contrario.
     */
    public MutableLiveData<RecursoUi<Boolean>> eliminarPrenda(String id) {
        return ejecutarVacio(servicioApi.eliminarPrenda(id));
    }

    /**
     * Publica (activo=true) o despublica (activo=false) una prenda.
     *
     * @param id identificador de la prenda.
     * @param activo {@code true} para publicarla (visible en el catálogo), {@code false} para ocultarla.
     * @return LiveData que emite {@code cargando()} y después {@code exito(producto)}
     *         con el estado actualizado, o {@code error(mensaje)} si falla.
     */
    public MutableLiveData<RecursoUi<DtoRespuestaProducto>> publicarPrenda(String id, boolean activo) {
        MutableLiveData<RecursoUi<DtoRespuestaProducto>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.publicarPrenda(id, new DtoPeticionPublicar(activo))
            .enqueue(new Callback<DtoRespuestaProductoEnvoltura>() {
                @Override
                public void onResponse(Call<DtoRespuestaProductoEnvoltura> c,
                                       Response<DtoRespuestaProductoEnvoltura> r) {
                    if (r.isSuccessful() && r.body() != null) {
                        res.postValue(RecursoUi.exito(r.body().producto));
                    } else {
                        res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                    }
                }
                @Override
                public void onFailure(Call<DtoRespuestaProductoEnvoltura> c, Throwable t) {
                    res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
                }
            });
        return res;
    }

    // ── Variantes ──────────────────────────────────────────────────────────────

    /**
     * Obtiene las variantes (combinaciones de talla/color/stock) de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         con las variantes, o {@code error(mensaje)} si falla la petición.
     */
    public MutableLiveData<RecursoUi<List<DtoVariante>>> listarVariantes(String productoId) {
        MutableLiveData<RecursoUi<List<DtoVariante>>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.listarVariantes(productoId).enqueue(new Callback<DtoRespuestaListaVariantes>() {
            @Override
            public void onResponse(Call<DtoRespuestaListaVariantes> c,
                                   Response<DtoRespuestaListaVariantes> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().variantes));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoRespuestaListaVariantes> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /**
     * Crea una nueva variante (talla/color/stock) para una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param cuerpo datos de la nueva variante.
     * @return LiveData con {@code exito(true)} si se creó correctamente, o {@code error(mensaje)}.
     */
    public MutableLiveData<RecursoUi<Boolean>> crearVariante(
        String productoId, DtoPeticionVariante cuerpo) {
        return ejecutarVacio(servicioApi.crearVariante(productoId, cuerpo));
    }

    /**
     * Elimina una variante de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id identificador de la variante a eliminar.
     * @return LiveData con {@code exito(true)} si se eliminó correctamente, o {@code error(mensaje)}.
     */
    public MutableLiveData<RecursoUi<Boolean>> eliminarVariante(String productoId, String id) {
        return ejecutarVacio(servicioApi.eliminarVariante(productoId, id));
    }

    // ── Fotos (URL en SQL) ──────────────────────────────────────────────────────

    /**
     * Obtiene las imágenes asociadas a una prenda (las URLs se almacenan en SQL,
     * no se sube el binario al backend de la app).
     *
     * @param productoId identificador de la prenda.
     * @return LiveData que emite {@code cargando()} y después {@code exito(lista)}
     *         con las imágenes, o {@code error(mensaje)} si falla la petición.
     */
    public MutableLiveData<RecursoUi<List<DtoImagen>>> listarImagenes(String productoId) {
        MutableLiveData<RecursoUi<List<DtoImagen>>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        servicioApi.listarImagenes(productoId).enqueue(new Callback<DtoRespuestaListaImagenes>() {
            @Override
            public void onResponse(Call<DtoRespuestaListaImagenes> c,
                                   Response<DtoRespuestaListaImagenes> r) {
                if (r.isSuccessful() && r.body() != null) {
                    res.postValue(RecursoUi.exito(r.body().imagenes));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<DtoRespuestaListaImagenes> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }

    /**
     * Añade una nueva imagen (por URL) a una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param cuerpo datos de la imagen (URL y si es la principal).
     * @return LiveData con {@code exito(true)} si se creó correctamente, o {@code error(mensaje)}.
     */
    public MutableLiveData<RecursoUi<Boolean>> crearImagen(
        String productoId, DtoPeticionImagen cuerpo) {
        return ejecutarVacio(servicioApi.crearImagen(productoId, cuerpo));
    }

    /**
     * Marca una imagen como principal de la prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id identificador de la imagen a marcar como principal.
     * @return LiveData con {@code exito(true)} si se actualizó correctamente, o {@code error(mensaje)}.
     */
    public MutableLiveData<RecursoUi<Boolean>> marcarImagenPrincipal(
        String productoId, String id) {
        return ejecutarVacio(servicioApi.marcarImagenPrincipal(productoId, id));
    }

    /**
     * Elimina una imagen de una prenda.
     *
     * @param productoId identificador de la prenda.
     * @param id identificador de la imagen a eliminar.
     * @return LiveData con {@code exito(true)} si se eliminó correctamente, o {@code error(mensaje)}.
     */
    public MutableLiveData<RecursoUi<Boolean>> eliminarImagen(String productoId, String id) {
        return ejecutarVacio(servicioApi.eliminarImagen(productoId, id));
    }

    // ── Util: llamadas sin cuerpo de respuesta (204/200 vacío) ───────────────────

    /**
     * Ejecuta una llamada Retrofit que no devuelve cuerpo (respuestas 204/200 vacías)
     * y la traduce a un {@link RecursoUi}&lt;Boolean&gt; uniforme: {@code true} si
     * la respuesta fue exitosa, o {@code error(mensaje)} en caso contrario.
     * Reutilizado por los métodos de creación/eliminación de variantes e imágenes.
     *
     * @param llamada llamada Retrofit pendiente de ejecutar (sin cuerpo de respuesta).
     * @return LiveData con el resultado de la operación.
     */
    private MutableLiveData<RecursoUi<Boolean>> ejecutarVacio(Call<Void> llamada) {
        MutableLiveData<RecursoUi<Boolean>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
        llamada.enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> c, Response<Void> r) {
                if (r.isSuccessful()) {
                    res.postValue(RecursoUi.exito(Boolean.TRUE));
                } else {
                    res.postValue(RecursoUi.error(RespuestasApi.extraerMensajeError(r)));
                }
            }
            @Override
            public void onFailure(Call<Void> c, Throwable t) {
                res.postValue(RecursoUi.error("Sin conexión: " + t.getMessage()));
            }
        });
        return res;
    }
}
