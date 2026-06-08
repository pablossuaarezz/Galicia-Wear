import { Rol } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { servicioNotificaciones } from '../notificaciones/servicio';
import { repositorioChat, type PerfilChat } from './repositorio';

// Forma del mensaje tal y como lo espera el cliente Android (eventos Socket.IO
// "nuevo_mensaje" / "mensaje_historial"): `contenido` y `fechaCreacion`, que mapean
// a las columnas `cuerpo` y `fechaEnvio` del modelo Prisma `Mensaje`.
export interface MensajeSocket {
  id: string;
  contenido: string;
  remitenteId: string;
  remitenteNombre: string;
  fechaCreacion: string;
  leido: boolean;
}

export interface ConversacionVista {
  peerId: string;
  nombre: string;
  ultimoMensaje: string;
  fechaUltimo: string;
  noLeidos: number;
}

function nombreVisible(perfil: PerfilChat): string {
  if (perfil.disenador) return perfil.disenador.nombreMarca;
  if (perfil.cliente) return `${perfil.cliente.nombre} ${perfil.cliente.apellidos}`.trim();
  return 'Usuario';
}

export const servicioChat = {
  // Persiste un mensaje y devuelve el payload listo para emitir por socket.
  // El chat de soporte es exclusivamente entre un CLIENTE y una tienda (DISENADOR).
  async enviar(remitenteId: string, destinatarioId: string, contenido: string): Promise<MensajeSocket> {
    if (remitenteId === destinatarioId) {
      throw new ErrorAccesoDenegado('No puedes enviarte mensajes a ti mismo');
    }

    const [remitente, destinatario] = await Promise.all([
      repositorioChat.perfilUsuario(remitenteId),
      repositorioChat.perfilUsuario(destinatarioId),
    ]);
    if (!remitente) throw new ErrorNoEncontrado('Remitente');
    if (!destinatario) throw new ErrorNoEncontrado('Destinatario');

    const roles = new Set<Rol>([remitente.rol, destinatario.rol]);
    if (!(roles.has(Rol.CLIENTE) && roles.has(Rol.DISENADOR))) {
      throw new ErrorAccesoDenegado('El chat de soporte es solo entre cliente y tienda');
    }

    const mensaje = await repositorioChat.crear(remitenteId, destinatarioId, contenido);

    // Notificación in-app/tiempo real para el destinatario (una por mensaje recibido).
    // No bloqueante: si Mongo/socket fallan, el mensaje se entrega igual por el chat.
    const nombreRemitente = nombreVisible(remitente);
    void servicioNotificaciones.crear({
      destinatarioId,
      tipo: 'MENSAJE_NUEVO',
      titulo: nombreRemitente,
      cuerpo: contenido.length > 80 ? `${contenido.slice(0, 79)}…` : contenido,
      datos: { peerId: remitenteId, nombre: nombreRemitente },
    });

    return {
      id: mensaje.id,
      contenido: mensaje.cuerpo,
      remitenteId: mensaje.remitenteId,
      remitenteNombre: nombreRemitente,
      fechaCreacion: mensaje.fechaEnvio.toISOString(),
      leido: false,
    };
  },

  // Historial entre el usuario y un peer, como lista de payloads de socket.
  async historial(usuarioId: string, peerId: string, limite = 50): Promise<MensajeSocket[]> {
    const [yo, peer] = await Promise.all([
      repositorioChat.perfilUsuario(usuarioId),
      repositorioChat.perfilUsuario(peerId),
    ]);
    if (!yo || !peer) return [];

    const nombreYo = nombreVisible(yo);
    const nombrePeer = nombreVisible(peer);
    const mensajes = await repositorioChat.historialEntre(usuarioId, peerId, limite);
    return mensajes.map((m) => ({
      id: m.id,
      contenido: m.cuerpo,
      remitenteId: m.remitenteId,
      remitenteNombre: m.remitenteId === usuarioId ? nombreYo : nombrePeer,
      fechaCreacion: m.fechaEnvio.toISOString(),
      leido: m.fechaLectura !== null,
    }));
  },

  async conversaciones(usuarioId: string): Promise<ConversacionVista[]> {
    const resumenes = await repositorioChat.conversacionesDe(usuarioId);
    return Promise.all(
      resumenes.map(async (r) => {
        const peer = await repositorioChat.perfilUsuario(r.peerId);
        return {
          peerId: r.peerId,
          nombre: peer ? nombreVisible(peer) : 'Usuario',
          ultimoMensaje: r.ultimoMensaje,
          fechaUltimo: r.fechaUltimo.toISOString(),
          noLeidos: r.noLeidos,
        };
      }),
    );
  },

  async marcarLeidos(usuarioId: string, peerId: string): Promise<number> {
    return repositorioChat.marcarLeidos(usuarioId, peerId);
  },
};
