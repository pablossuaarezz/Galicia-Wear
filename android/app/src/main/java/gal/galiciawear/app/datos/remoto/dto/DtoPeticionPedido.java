package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /pedidos (checkout) */
public class DtoPeticionPedido {
    /** Identificador de la dirección de envío seleccionada para el pedido. */
    @SerializedName("direccionEnvioId")
    public final String direccionEnvioId;

    /** Método de pago elegido por el usuario (p. ej. tarjeta, contra reembolso). */
    @SerializedName("metodoPago")
    public final String metodoPago;

    /** Indica si el usuario ha solicitado un envío ecológico para este pedido. */
    @SerializedName("envioEcologico")
    public final boolean envioEcologico;

    /**
     * Crea la petición de checkout para finalizar el pedido.
     *
     * @param direccionEnvioId identificador de la dirección de envío.
     * @param metodoPago       método de pago seleccionado.
     * @param envioEcologico   {@code true} si se solicita envío ecológico.
     */
    public DtoPeticionPedido(String direccionEnvioId, String metodoPago, boolean envioEcologico) {
        this.direccionEnvioId = direccionEnvioId;
        this.metodoPago       = metodoPago;
        this.envioEcologico   = envioEcologico;
    }
}
