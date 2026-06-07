package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Cuerpo parcial de PATCH /productos/{id} para publicar o despublicar una prenda.
 * El backend acepta actualizaciones parciales, así que solo enviamos `activo`.
 */
public class DtoPeticionPublicar {
    @SerializedName("activo")
    public final boolean activo;

    public DtoPeticionPublicar(boolean activo) {
        this.activo = activo;
    }
}
