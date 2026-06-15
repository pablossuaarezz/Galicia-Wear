package gal.galiciawear.app.datos.remoto.dto;

import com.google.gson.annotations.SerializedName;

/** Cuerpo de PUT /usuarios/yo/fcm-token: registra el token de push del dispositivo. */
public class DtoPeticionTokenFcm {
    /** Token de notificaciones push (Firebase Cloud Messaging) del dispositivo. */
    @SerializedName("token")
    public String token;

    /** Plataforma del dispositivo; siempre se fija a "android" desde esta app. */
    @SerializedName("plataforma")
    public String plataforma;

    /**
     * Crea la petición de registro del token FCM del dispositivo Android.
     *
     * @param token token de notificaciones push generado por Firebase.
     */
    public DtoPeticionTokenFcm(String token) {
        this.token = token;
        this.plataforma = "android";
    }
}
