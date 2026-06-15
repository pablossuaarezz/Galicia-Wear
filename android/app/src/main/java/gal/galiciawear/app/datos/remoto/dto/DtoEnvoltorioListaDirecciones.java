package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Envoltura que devuelve el backend con el listado de direcciones de envío
 * guardadas por el usuario. El JSON real tiene la forma
 * {@code { "direcciones": [...] }}.
 *
 * Endpoint asociado: GET /direcciones.
 */
public class DtoEnvoltorioListaDirecciones {
    /** Lista de direcciones de envío registradas por el usuario. */
    @SerializedName("direcciones")
    public List<DtoRespuestaDireccion> direcciones;
}
