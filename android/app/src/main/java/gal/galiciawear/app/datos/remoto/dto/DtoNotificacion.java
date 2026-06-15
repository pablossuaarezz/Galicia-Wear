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
    /** Identificador único de la notificación. */
    @SerializedName("id")
    public String id;

    /** Tipo de notificación (p. ej. "PEDIDO_ENVIADO", "MENSAJE_NUEVO", etc.). */
    @SerializedName("tipo")
    public String tipo;

    /** Título mostrado al usuario en la notificación. */
    @SerializedName("titulo")
    public String titulo;

    /** Texto/cuerpo descriptivo de la notificación. */
    @SerializedName("cuerpo")
    public String cuerpo;

    /**
     * Datos adicionales asociados a la notificación, usados para la navegación
     * cuando el usuario pulsa sobre ella. El contenido depende de {@code tipo}:
     * por ejemplo, "pedidoId" para notificaciones de pedido, o "peerId"/"nombre"
     * para notificaciones de mensajes nuevos.
     */
    @SerializedName("datos")
    public Map<String, String> datos;

    /** Indica si el usuario ya ha leído esta notificación. */
    @SerializedName("leida")
    public boolean leida;

    /** Fecha de creación de la notificación. */
    @SerializedName("fechaCreacion")
    public String fechaCreacion;

    /**
     * Lee una clave del mapa {@code datos} con seguridad ante nulos.
     *
     * @param clave nombre de la clave a buscar (p. ej. "pedidoId", "peerId").
     * @return el valor asociado a la clave, o {@code null} si el mapa
     *         {@code datos} es nulo o no contiene dicha clave.
     */
    public String dato(String clave) {
        return datos != null ? datos.get(clave) : null;
    }
}
