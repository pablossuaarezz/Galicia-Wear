// Persistencia de tokens FCM por dispositivo (Mongo). Usado por el endpoint
// PUT /usuarios/yo/fcm-token y por el helper de push best-effort.
import { DeviceToken } from '../mongo/esquemas/deviceToken';

/**
 * Operaciones de acceso a datos sobre la colección `device_tokens` (Mongo). Gestiona el
 * ciclo de vida de los tokens FCM registrados por los dispositivos de cada usuario:
 * alta/actualización, consulta de tokens de un usuario y eliminación (p. ej. tokens
 * caducados detectados por el módulo `fcm`).
 */
export const repositorioTokens = {
  // Upsert por token: si el mismo token reaparece (reinstalación, otro usuario en el
  // dispositivo) se reasigna al usuario actual y se refresca la fecha.
  /**
   * Registra o actualiza el token FCM de un dispositivo para un usuario.
   * Usa `updateOne` con `upsert: true` sobre el campo `token` (único): si el token ya
   * existía (p. ej. la app se reinstaló o el dispositivo cambió de usuario), se
   * actualiza el `usuarioId` asociado en lugar de crear un duplicado.
   * @param usuarioId UUID del usuario propietario del dispositivo.
   * @param token token FCM del dispositivo.
   * @param plataforma sistema operativo del dispositivo (por defecto 'android').
   */
  async guardar(usuarioId: string, token: string, plataforma = 'android'): Promise<void> {
    await DeviceToken.updateOne(
      { token },
      { $set: { usuarioId, token, plataforma, fechaActualizacion: new Date() } },
      { upsert: true },
    );
  },

  /**
   * Obtiene todos los tokens FCM registrados para un usuario (puede tener varios
   * dispositivos), para poder enviarles un push multicast.
   * @param usuarioId UUID del usuario.
   * @returns array de tokens FCM (puede estar vacío si el usuario no tiene dispositivos registrados).
   */
  async tokensDe(usuarioId: string): Promise<string[]> {
    const docs = await DeviceToken.find({ usuarioId }).select('token').lean();
    return docs.map((d) => d.token);
  },

  /**
   * Elimina un token de dispositivo, normalmente porque FCM lo ha reportado como
   * caducado o no registrado (limpieza best-effort tras un envío de push).
   * @param token token FCM a eliminar.
   */
  async eliminar(token: string): Promise<void> {
    await DeviceToken.deleteOne({ token });
  },
};
