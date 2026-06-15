package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Envoltura {@code { "disenador": {...} } } que devuelven los endpoints de
 * diseñador (GET /disenadores/yo, POST /disenadores/solicitar, PATCH /disenadores/yo).
 * El backend anida el objeto bajo la clave "disenador" en lugar de devolverlo
 * en la raíz de la respuesta.
 */
public class DtoRespuestaDisenador {
    /** Perfil de diseñador devuelto por el backend. */
    @SerializedName("disenador")
    public DtoDisenador disenador;
}
