package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Imagen de producto almacenada en SQL como URL, tal como la devuelve el backend. */
public class DtoImagen {
    @SerializedName("id")
    public String id;

    @SerializedName("url")
    public String url;

    @SerializedName("textoAlternativo")
    public String textoAlternativo;

    @SerializedName("posicion")
    public int posicion;

    @SerializedName("esPrincipal")
    public boolean esPrincipal;
}
