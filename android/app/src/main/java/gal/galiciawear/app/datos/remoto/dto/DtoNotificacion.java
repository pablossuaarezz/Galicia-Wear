package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.Map;

/**
 * Notificación in-app — GET /notificaciones y evento Socket.IO "nueva_notificacion".
 * El backend envía el mismo DTO por REST y por socket, así que se reutiliza en ambos.
 *
 * `datos` lleva la info de navegación según el tipo:
 *   - PEDIDO_*      → { "pedidoId": "..." }
 *   - MENSAJE_NUEVO → { "peerId": "...", "nombre": "..." }
 */
public class DtoNotificacion {
    @SerializedName("id")
    public String id;

    @SerializedName("tipo")
    public String tipo;

    @SerializedName("titulo")
    public String titulo;

    @SerializedName("cuerpo")
    public String cuerpo;

    @SerializedName("datos")
    public Map<String, String> datos;

    @SerializedName("leida")
    public boolean leida;

    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    /** Lee una clave de `datos` con seguridad ante nulos. */
    public String dato(String clave) {
        return datos != null ? datos.get(clave) : null;
    }
}
