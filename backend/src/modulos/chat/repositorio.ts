import { Mensaje, Rol } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

// Perfil mínimo de un usuario para resolver su nombre visible en el chat.
export interface PerfilChat {
  id: string;
  rol: Rol;
  cliente: { nombre: string; apellidos: string } | null;
  disenador: { nombreMarca: string } | null;
}

// Resumen de una conversación para la bandeja (un peer = el otro interlocutor).
export interface ResumenConversacion {
  peerId: string;
  ultimoMensaje: string;
  fechaUltimo: Date;
  noLeidos: number;
}

export class RepositorioChat extends RepositorioBase<Mensaje> {
  async buscarPorId(id: string): Promise<Mensaje | null> {
    return this.bd.mensaje.findUnique({ where: { id } });
  }

  // Datos para resolver el nombre a mostrar (marca si es tienda, nombre+apellidos si cliente).
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

  async crear(remitenteId: string, destinatarioId: string, cuerpo: string): Promise<Mensaje> {
    return this.bd.mensaje.create({ data: { remitenteId, destinatarioId, cuerpo } });
  }

  // Historial entre dos usuarios (en ambos sentidos), en orden cronológico ascendente.
  async historialEntre(idA: string, idB: string, limite = 50): Promise<Mensaje[]> {
    const mensajes = await this.bd.mensaje.findMany({
      where: {
        OR: [
          { remitenteId: idA, destinatarioId: idB },
          { remitenteId: idB, destinatarioId: idA },
        ],
      },
      orderBy: { fechaEnvio: 'desc' },
      take: limite,
    });
    return mensajes.reverse();
  }

  // Conversaciones de un usuario, agrupadas por el otro interlocutor (más reciente primero).
  async conversacionesDe(usuarioId: string): Promise<ResumenConversacion[]> {
    const mensajes = await this.bd.mensaje.findMany({
      where: { OR: [{ remitenteId: usuarioId }, { destinatarioId: usuarioId }] },
      orderBy: { fechaEnvio: 'desc' },
    });

    const mapa = new Map<string, ResumenConversacion>();
    for (const m of mensajes) {
      const peerId = m.remitenteId === usuarioId ? m.destinatarioId : m.remitenteId;
      let resumen = mapa.get(peerId);
      if (!resumen) {
        // Como van ordenados desc, el primero que vemos de cada peer es el más reciente.
        resumen = { peerId, ultimoMensaje: m.cuerpo, fechaUltimo: m.fechaEnvio, noLeidos: 0 };
        mapa.set(peerId, resumen);
      }
      if (m.destinatarioId === usuarioId && m.fechaLectura === null) {
        resumen.noLeidos += 1;
      }
    }
    return Array.from(mapa.values());
  }

  // Marca como leídos los mensajes que el peer me envió y aún no había leído.
  async marcarLeidos(usuarioId: string, peerId: string): Promise<number> {
    const resultado = await this.bd.mensaje.updateMany({
      where: { remitenteId: peerId, destinatarioId: usuarioId, fechaLectura: null },
      data: { fechaLectura: new Date() },
    });
    return resultado.count;
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.mensaje.delete({ where: { id } });
  }
}

export const repositorioChat = new RepositorioChat();
