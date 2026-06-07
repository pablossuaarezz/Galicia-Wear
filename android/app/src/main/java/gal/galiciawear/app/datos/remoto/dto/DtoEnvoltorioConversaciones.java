package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Envoltura {@code { "conversaciones": [...] }} de GET /chat/conversaciones. */
public class DtoEnvoltorioConversaciones {
    @SerializedName("conversaciones")
    public List<DtoConversacion> conversaciones;
}
