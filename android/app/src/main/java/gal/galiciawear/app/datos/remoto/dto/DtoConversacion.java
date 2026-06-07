package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Resumen de una conversación de soporte — GET /chat/conversaciones */
public class DtoConversacion {
    @SerializedName("peerId")
    public String peerId;

    @SerializedName("nombre")
    public String nombre;

    @SerializedName("ultimoMensaje")
    public String ultimoMensaje;

    @SerializedName("fechaUltimo")
    public String fechaUltimo;

    @SerializedName("noLeidos")
    public int noLeidos;
}
