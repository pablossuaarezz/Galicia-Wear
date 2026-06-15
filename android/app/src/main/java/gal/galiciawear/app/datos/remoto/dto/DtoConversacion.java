package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * DTO que representa el resumen de una conversación de chat/soporte entre
 * el usuario y otro interlocutor (por ejemplo, un diseñador o un cliente).
 * Se utiliza para listar las conversaciones del usuario en la pantalla de
 * mensajes.
 *
 * Endpoint asociado: GET /chat/conversaciones.
 */
public class DtoConversacion {
    /** Identificador del usuario con el que se mantiene la conversación. */
    @SerializedName("peerId")
    public String peerId;

    /** Nombre visible del interlocutor de la conversación. */
    @SerializedName("nombre")
    public String nombre;

    /** Texto del último mensaje intercambiado en la conversación. */
    @SerializedName("ultimoMensaje")
    public String ultimoMensaje;

    /** Fecha/hora del último mensaje, en formato proporcionado por el backend. */
    @SerializedName("fechaUltimo")
    public String fechaUltimo;

    /** Número de mensajes de esta conversación que el usuario aún no ha leído. */
    @SerializedName("noLeidos")
    public int noLeidos;
}
