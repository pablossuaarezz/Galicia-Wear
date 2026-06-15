/**
 * Repositorio del módulo Chat.
 *
 * Encapsula el acceso a Prisma para el modelo `Mensaje` y para los datos de
 * perfil necesarios para resolver el nombre visible de cada interlocutor
 * (cliente o diseñador/tienda). Construye, a partir de los mensajes en bruto,
 * el historial entre dos usuarios y el resumen de conversaciones para la
 * bandeja de entrada del chat de soporte.
 */
import { Mensaje, Rol } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

// Perfil mínimo de un usuario para resolver su nombre visible en el chat.
/**
 * Datos mínimos de un usuario necesarios para mostrar su nombre en el chat:
 * si es DISENADOR se usa el nombre de marca, si es CLIENTE se usa nombre + apellidos.
 */
export interface PerfilChat {
  id: string;
  rol: Rol;
  cliente: { nombre: string; apellidos: string } | null;
  disenador: { nombreMarca: string } | null;
}

// Resumen de una conversación para la bandeja (un peer = el otro interlocutor).
/**
 * Resumen de una conversación tal y como se muestra en la bandeja de entrada:
 * el otro interlocutor (`peerId`), el último mensaje intercambiado, su fecha y
 * el número de mensajes pendientes de leer por el usuario actual.
 */
export interface ResumenConversacion {
  peerId: string;
  ultimoMensaje: string;
  fechaUltimo: Date;
  noLeidos: number;
}

/**
 * Repositorio de acceso a datos del chat de soporte (mensajería entre cliente y tienda).
 * Extiende `RepositorioBase` para reutilizar la conexión a base de datos (`this.bd`).
 */
export class RepositorioChat extends RepositorioBase<Mensaje> {
  /**
   * Busca un mensaje por su identificador.
   * @param id identificador del mensaje.
   * @returns el mensaje o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<Mensaje | null> {
    return this.bd.mensaje.findUnique({ where: { id } });
  }

  // Datos para resolver el nombre a mostrar (marca si es tienda, nombre+apellidos si cliente).
  /**
   * Obtiene el perfil mínimo de un usuario (rol y datos de nombre) necesario para
   * mostrar su identidad en la interfaz de chat.
   * @param id identificador del usuario.
   * @returns el perfil del usuario o `null` si no existe.
   */
  async perfilUsuario(id: string): Promise<PerfilChat | null> {
    return this.bd.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        rol: true,
        cliente: { select: { nombre: true, apellidos: true } },
        disenador: { select: { nombreMarca: true } },
      },
    });
  }

  /**
   * Crea (persiste) un nuevo mensaje en la base de datos.
   * @param remitenteId identificador del usuario que envía el mensaje.
   * @param destinatarioId identificador del usuario que recibe el mensaje.
   * @param cuerpo contenido textual del mensaje.
   * @returns el mensaje creado, con su id y fechas generadas por la base de datos.
   */
  async crear(remitenteId: string, destinatarioId: string, cuerpo: string): Promise<Mensaje> {
    return this.bd.mensaje.create({ data: { remitenteId, destinatarioId, cuerpo } });
  }

  // Historial entre dos usuarios (en ambos sentidos), en orden cronológico ascendente.
  /**
   * Recupera el historial de mensajes intercambiados entre dos usuarios, en
   * cualquiera de los dos sentidos (idA→idB o idB→idA), limitado a los `limite`
   * más recientes y devuelto en orden cronológico ascendente (más antiguo primero),
   * que es el orden natural para pintar una conversación de chat.
   * @param idA identificador de uno de los dos usuarios.
   * @param idB identificador del otro usuario.
   * @param limite número máximo de mensajes a recuperar (por defecto 50).
   * @returns lista de mensajes en orden cronológico ascendente.
   */
  async historialEntre(idA: string, idB: string, limite = 50): Promise<Mensaje[]> {
    const mensajes = await this.bd.mensaje.findMany({
      where: {
        OR: [
          { remitenteId: idA, destinatarioId: idB },
          { remitenteId: idB, destinatarioId: idA },
        ],
      },
      // Se pide en orden descendente para poder limitar a los N más recientes...
      orderBy: { fechaEnvio: 'desc' },
      take: limite,
    });
    // ...y luego se invierte para devolverlos en orden cronológico ascendente.
    return mensajes.reverse();
  }

  // Conversaciones de un usuario, agrupadas por el otro interlocutor (más reciente primero).
  /**
   * Construye el listado de conversaciones de un usuario (bandeja de entrada),
   * agrupando todos los mensajes enviados o recibidos por `usuarioId` según el
   * otro interlocutor (peer), y calculando para cada peer el último mensaje y
   * el número de mensajes no leídos recibidos de ese peer.
   * @param usuarioId identificador del usuario cuya bandeja se construye.
   * @returns lista de resúmenes de conversación, uno por cada peer con el que
   * existe al menos un mensaje.
   */
  async conversacionesDe(usuarioId: string): Promise<ResumenConversacion[]> {
    const mensajes = await this.bd.mensaje.findMany({
      where: { OR: [{ remitenteId: usuarioId }, { destinatarioId: usuarioId }] },
      orderBy: { fechaEnvio: 'desc' },
    });

    // Recorremos todos los mensajes (ordenados del más reciente al más antiguo)
    // y los agrupamos por "peer" (el otro interlocutor de cada mensaje).
    const mapa = new Map<string, ResumenConversacion>();
    for (const m of mensajes) {
      const peerId = m.remitenteId === usuarioId ? m.destinatarioId : m.remitenteId;
      let resumen = mapa.get(peerId);
      if (!resumen) {
        // Como van ordenados desc, el primero que vemos de cada peer es el más reciente.
        resumen = { peerId, ultimoMensaje: m.cuerpo, fechaUltimo: m.fechaEnvio, noLeidos: 0 };
        mapa.set(peerId, resumen);
      }
      // Contamos como "no leído" únicamente los mensajes que el peer me envió a mí
      // y que todavía no tienen fecha de lectura registrada.
      if (m.destinatarioId === usuarioId && m.fechaLectura === null) {
        resumen.noLeidos += 1;
      }
    }
    return Array.from(mapa.values());
  }

  // Marca como leídos los mensajes que el peer me envió y aún no había leído.
  /**
   * Marca como leídos (asignando la fecha de lectura actual) todos los mensajes
   * que `peerId` envió a `usuarioId` y que todavía no habían sido leídos.
   * @param usuarioId identificador del usuario que lee los mensajes (destinatario).
   * @param peerId identificador del usuario que envió los mensajes (remitente).
   * @returns el número de mensajes actualizados (marcados como leídos).
   */
  async marcarLeidos(usuarioId: string, peerId: string): Promise<number> {
    const resultado = await this.bd.mensaje.updateMany({
      where: { remitenteId: peerId, destinatarioId: usuarioId, fechaLectura: null },
      data: { fechaLectura: new Date() },
    });
    return resultado.count;
  }

  /**
   * Elimina un mensaje de la base de datos por su identificador.
   * @param id identificador del mensaje a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.mensaje.delete({ where: { id } });
  }
}

/** Instancia única (singleton) del repositorio de chat. */
export const repositorioChat = new RepositorioChat();
