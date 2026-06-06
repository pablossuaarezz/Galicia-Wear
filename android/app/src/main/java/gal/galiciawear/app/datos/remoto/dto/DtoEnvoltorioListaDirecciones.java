package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura {@code { "direcciones": [...] }} de GET /direcciones. */
public class DtoEnvoltorioListaDirecciones {
    @SerializedName("direcciones")
    public List<DtoRespuestaDireccion> direcciones;
}
