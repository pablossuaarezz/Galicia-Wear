/**
 * Servicio del módulo Chat.
 *
 * Contiene la lógica de negocio del chat de soporte entre clientes y tiendas
 * (diseñadores): validación de que ambos interlocutores existen y de que la
 * conversación cumple la regla de negocio (solo entre CLIENTE y DISENADOR),
 * persistencia del mensaje, disparo de notificaciones para el destinatario y
 * transformación de los mensajes a la forma esperada por el cliente Android
 * vía Socket.IO (`MensajeSocket`).
 */
import { Rol } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { servicioNotificaciones } from '../notificaciones/servicio';
import { repositorioChat, type PerfilChat } from './repositorio';

// Forma del mensaje tal y como lo espera el cliente Android (eventos Socket.IO
// "nuevo_mensaje" / "mensaje_historial"): `contenido` y `fechaCreacion`, que mapean
// a las columnas `cuerpo` y `fechaEnvio` del modelo Prisma `Mensaje`.
/**
 * Representación de un mensaje de chat tal y como se envía por Socket.IO a los
 * clientes Android (eventos "nuevo_mensaje" y "mensaje_historial"). Es una
 * adaptación del modelo Prisma `Mensaje`: `contenido` ↔ `cuerpo`,
 * `fechaCreacion` ↔ `fechaEnvio` (en formato ISO 8601), y añade el nombre
 * visible del remitente (`remitenteNombre`) ya resuelto.
 */
export interface MensajeSocket {
  id: string;
  contenido: string;
  remitenteId: string;
  remitenteNombre: string;
  fechaCreacion: string;
  leido: boolean;
}

/**
 * Representación de una conversación en la bandeja de entrada del chat,
 * incluyendo el nombre visible del otro interlocutor (`peer`) y el resumen
 * del último mensaje intercambiado.
 */
export interface ConversacionVista {
  peerId: string;
  nombre: string;
  ultimoMensaje: string;
  fechaUltimo: string;
  noLeidos: number;
}

/**
 * Calcula el nombre visible de un usuario en el chat a partir de su perfil:
 * si es diseñador (tienda) se usa el nombre de la marca; si es cliente, su
 * nombre y apellidos; en cualquier otro caso, un valor genérico de respaldo.
 * @param perfil perfil mínimo del usuario obtenido del repositorio.
 * @returns el nombre que debe mostrarse en la interfaz de chat.
 */
function nombreVisible(perfil: PerfilChat): string {
  if (perfil.disenador) return perfil.disenador.nombreMarca;
  if (perfil.cliente) return `${perfil.cliente.nombre} ${perfil.cliente.apellidos}`.trim();
  return 'Usuario';
}

export const servicioChat = {
  // Persiste un mensaje y devuelve el payload listo para emitir por socket.
  // El chat de soporte es exclusivamente entre un CLIENTE y una tienda (DISENADOR).
  /**
   * Envía (persiste) un nuevo mensaje de chat de soporte entre `remitenteId` y
   * `destinatarioId`, valida las reglas de negocio del chat y dispara una
   * notificación para el destinatario.
   *
   * Reglas validadas:
   * - No se puede enviar un mensaje a uno mismo.
   * - Ambos usuarios (remitente y destinatario) deben existir.
   * - La conversación debe ser exclusivamente entre un CLIENTE y un DISENADOR
   *   (el chat de soporte no admite otras combinaciones de roles).
   *
   * @param remitenteId identificador del usuario que envía el mensaje (autenticado por socket).
   * @param destinatarioId identificador del usuario que debe recibir el mensaje.
   * @param contenido texto del mensaje (ya validado por `dtoEnviarMensaje`).
   * @returns el mensaje en formato `MensajeSocket`, listo para emitir por Socket.IO.
   */
  async enviar(remitenteId: string, destinatarioId: string, contenido: string): Promise<MensajeSocket> {
    if (remitenteId === destinatarioId) {
      throw new ErrorAccesoDenegado('No puedes enviarte mensajes a ti mismo');
    }

    // Obtenemos ambos perfiles en paralelo para minimizar la latencia antes de
    // realizar las comprobaciones de existencia y de rol.
    const [remitente, destinatario] = await Promise.all([
      repositorioChat.perfilUsuario(remitenteId),
      repositorioChat.perfilUsuario(destinatarioId),
    ]);
    if (!remitente) throw new ErrorNoEncontrado('Remitente');
    if (!destinatario) throw new ErrorNoEncontrado('Destinatario');

    // El chat de soporte solo tiene sentido entre un cliente y una tienda; se
    // usa un Set para comprobar, sin importar el orden, que ambos roles están
    // presentes exactamente una vez entre los dos interlocutores.
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
      // Se recorta el contenido a 80 caracteres para la vista previa de la notificación,
      // añadiendo puntos suspensivos cuando el mensaje original es más largo.
      cuerpo: contenido.length > 80 ? `${contenido.slice(0, 79)}…` : contenido,
      datos: { peerId: remitenteId, nombre: nombreRemitente },
    });

    // Se traduce el modelo Prisma `Mensaje` a la forma `MensajeSocket` esperada
    // por el cliente Android (cuerpo→contenido, fechaEnvio→fechaCreacion ISO).
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
  /**
   * Obtiene el historial de mensajes entre el usuario autenticado y un peer,
   * transformado a la forma `MensajeSocket` con los nombres visibles ya resueltos.
   * Si alguno de los dos perfiles no existe, devuelve una lista vacía en lugar
   * de lanzar un error, ya que no se considera una operación crítica.
   * @param usuarioId identificador del usuario autenticado.
   * @param peerId identificador del otro interlocutor de la conversación.
   * @param limite número máximo de mensajes a devolver (por defecto 50).
   * @returns lista de mensajes en formato `MensajeSocket`, en orden cronológico ascendente.
   */
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
      // El nombre mostrado depende de quién sea el remitente de cada mensaje:
      // si lo envió el propio usuario, se usa su nombre; si no, el del peer.
      remitenteNombre: m.remitenteId === usuarioId ? nombreYo : nombrePeer,
      fechaCreacion: m.fechaEnvio.toISOString(),
      leido: m.fechaLectura !== null,
    }));
  },

  /**
   * Construye la bandeja de entrada del usuario: para cada conversación
   * (resumida por el repositorio), resuelve el nombre visible del peer
   * correspondiente y formatea las fechas a ISO 8601.
   * @param usuarioId identificador del usuario autenticado.
   * @returns lista de conversaciones formateadas para la vista de bandeja.
   */
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

  /**
   * Marca como leídos los mensajes que `peerId` envió a `usuarioId`.
   * Operación de paso directo al repositorio, sin lógica adicional.
   * @param usuarioId identificador del usuario que marca los mensajes como leídos.
   * @param peerId identificador del remitente de los mensajes.
   * @returns el número de mensajes marcados como leídos.
   */
  async marcarLeidos(usuarioId: string, peerId: string): Promise<number> {
    return repositorioChat.marcarLeidos(usuarioId, peerId);
  },
};
