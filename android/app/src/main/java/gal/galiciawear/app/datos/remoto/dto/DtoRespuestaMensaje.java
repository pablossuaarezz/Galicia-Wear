package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Mensaje de chat recibido a través de Socket.IO, en los eventos
 * "nuevo_mensaje" (mensaje individual en tiempo real) y "mensaje_historial"
 * (carga del historial de la conversación).
 */
public class DtoRespuestaMensaje {
    /** Identificador único del mensaje. */
    @SerializedName("id")
    public String id;

    /** Texto/contenido del mensaje. */
    @SerializedName("contenido")
    public String contenido;

    /** Identificador del usuario que envía el mensaje. */
    @SerializedName("remitenteId")
    public String remitenteId;

    /** Nombre visible del remitente del mensaje. */
    @SerializedName("remitenteNombre")
    public String remitenteNombre;

    /** Fecha/hora de creación del mensaje, en el formato proporcionado por el backend. */
    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    /** Indica si el mensaje ya ha sido leído por el destinatario. */
    @SerializedName("leido")
    public boolean leido;
}
