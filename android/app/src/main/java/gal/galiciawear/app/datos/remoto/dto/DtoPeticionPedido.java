package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de POST /pedidos (checkout) */
public class DtoPeticionPedido {
    @SerializedName("direccionEnvioId")
    public final String direccionEnvioId;

    @SerializedName("metodoPago")
    public final String metodoPago;

    @SerializedName("envioEcologico")
    public final boolean envioEcologico;

    public DtoPeticionPedido(String direccionEnvioId, String metodoPago, boolean envioEcologico) {
        this.direccionEnvioId = direccionEnvioId;
        this.metodoPago       = metodoPago;
        this.envioEcologico   = envioEcologico;
    }
}
