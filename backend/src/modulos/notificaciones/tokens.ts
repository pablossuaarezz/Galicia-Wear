// Persistencia de tokens FCM por dispositivo (Mongo). Usado por el endpoint
// PUT /usuarios/yo/fcm-token y por el helper de push best-effort.
import { DeviceToken } from '../mongo/esquemas/deviceToken';

export const repositorioTokens = {
  // Upsert por token: si el mismo token reaparece (reinstalación, otro usuario en el
  // dispositivo) se reasigna al usuario actual y se refresca la fecha.
  async guardar(usuarioId: string, token: string, plataforma = 'android'): Promise<void> {
    await DeviceToken.updateOne(
      { token },
      { $set: { usuarioId, token, plataforma, fechaActualizacion: new Date() } },
      { upsert: true },
    );
  },

  async tokensDe(usuarioId: string): Promise<string[]> {
    const docs = await DeviceToken.find({ usuarioId }).select('token').lean();
    return docs.map((d) => d.token);
  },

  async eliminar(token: string): Promise<void> {
    await DeviceToken.deleteOne({ token });
  },
};
