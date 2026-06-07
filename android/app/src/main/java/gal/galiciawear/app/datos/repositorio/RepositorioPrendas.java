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

    @Inject
    public RepositorioPrendas(ServicioApi servicioApi) {
        this.servicioApi = servicioApi;
    }

    // ── Prendas ───────────────────────────────────────────────────────────────

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

    public MutableLiveData<RecursoUi<DtoRespuestaProducto>> guardarPrenda(
        String id, DtoPeticionProducto cuerpo) {
        MutableLiveData<RecursoUi<DtoRespuestaProducto>> res = new MutableLiveData<>();
        res.setValue(RecursoUi.cargando());
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

    public MutableLiveData<RecursoUi<Boolean>> eliminarPrenda(String id) {
        return ejecutarVacio(servicioApi.eliminarPrenda(id));
    }

    /** Publica (activo=true) o despublica (activo=false) una prenda. */
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

    public MutableLiveData<RecursoUi<Boolean>> crearVariante(
        String productoId, DtoPeticionVariante cuerpo) {
        return ejecutarVacio(servicioApi.crearVariante(productoId, cuerpo));
    }

    public MutableLiveData<RecursoUi<Boolean>> eliminarVariante(String productoId, String id) {
        return ejecutarVacio(servicioApi.eliminarVariante(productoId, id));
    }

    // ── Fotos (URL en SQL) ──────────────────────────────────────────────────────

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

    public MutableLiveData<RecursoUi<Boolean>> crearImagen(
        String productoId, DtoPeticionImagen cuerpo) {
        return ejecutarVacio(servicioApi.crearImagen(productoId, cuerpo));
    }

    public MutableLiveData<RecursoUi<Boolean>> marcarImagenPrincipal(
        String productoId, String id) {
        return ejecutarVacio(servicioApi.marcarImagenPrincipal(productoId, id));
    }

    public MutableLiveData<RecursoUi<Boolean>> eliminarImagen(String productoId, String id) {
        return ejecutarVacio(servicioApi.eliminarImagen(productoId, id));
    }

    // ── Util: llamadas sin cuerpo de respuesta (204/200 vacío) ───────────────────

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
