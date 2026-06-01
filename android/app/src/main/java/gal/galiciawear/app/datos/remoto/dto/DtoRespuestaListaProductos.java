package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/** Página de resultados del endpoint GET /productos */
public class DtoRespuestaListaProductos {
    @SerializedName("datos")
    public List<DtoRespuestaProducto> datos;

    @SerializedName("total")
    public int total;

    @SerializedName("pagina")
    public int pagina;

    @SerializedName("tamano")
    public int tamano;
}
