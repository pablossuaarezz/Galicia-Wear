package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de PUT /usuarios/yo/fcm-token: registra el token de push del dispositivo. */
public class DtoPeticionTokenFcm {
    @SerializedName("token")
    public String token;

    @SerializedName("plataforma")
    public String plataforma;

    public DtoPeticionTokenFcm(String token) {
        this.token = token;
        this.plataforma = "android";
    }
}
