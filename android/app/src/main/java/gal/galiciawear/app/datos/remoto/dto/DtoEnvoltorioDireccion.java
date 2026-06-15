package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/**
 * Envoltura que devuelve el backend al crear una nueva dirección de envío.
 * El JSON real tiene la forma {@code { "direccion": {...} }}.
 *
 * Endpoint asociado: POST /direcciones.
 */
public class DtoEnvoltorioDireccion {
    /** Dirección de envío recién creada, devuelta por el backend. */
    @SerializedName("direccion")
    public DtoRespuestaDireccion direccion;
}
