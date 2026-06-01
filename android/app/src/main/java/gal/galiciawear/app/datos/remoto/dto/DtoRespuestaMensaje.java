package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Mensaje de chat — Socket.IO evento "nuevo_mensaje" / "mensaje_historial" */
public class DtoRespuestaMensaje {
    @SerializedName("id")
    public String id;

    @SerializedName("contenido")
    public String contenido;

    @SerializedName("remitenteId")
    public String remitenteId;

    @SerializedName("remitenteNombre")
    public String remitenteNombre;

    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    @SerializedName("leido")
    public boolean leido;
}
