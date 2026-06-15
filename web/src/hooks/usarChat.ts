// Hook de una conversación de chat con un peer. Carga el historial por REST (rápido y fiable) y
// se suscribe al socket para los mensajes en vivo. El ENVÍO es por Socket.IO (no hay endpoint
// REST): el servidor devuelve el eco `nuevo_mensaje`, así que el propio mensaje aparece al volver.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiChat } from '@/api/endpoints/chat';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { obtenerSocket } from '@/tiempoReal/socket';
import type { MensajeChat } from '@/api/tipos';

/**
 * Gestiona una conversación de chat uno a uno con un interlocutor (`peerId`).
 *
 * Combina dos fuentes de datos: el historial inicial obtenido por REST (mediante React Query)
 * y los mensajes que llegan en vivo a través de Socket.IO. El envío de mensajes se realiza
 * exclusivamente por el socket; el servidor responde con un eco (`nuevo_mensaje`) que hace que
 * el propio mensaje aparezca en la lista al recibirse de vuelta.
 *
 * @param peerId Identificador del interlocutor de la conversación, o `undefined` si todavía no
 *   se conoce (p. ej. cuando el parámetro de ruta aún no está disponible). Con `undefined` no
 *   se carga historial ni se establece la suscripción.
 * @returns Un objeto con:
 *   - `mensajes`: lista combinada de historial y mensajes en vivo, sin duplicados y ordenada
 *     cronológicamente.
 *   - `enviar(contenido)`: función para enviar un mensaje de texto al interlocutor.
 *   - `miId`: identificador del usuario autenticado (para distinguir mensajes propios y ajenos).
 *   - `conectado`: indica si el socket está conectado actualmente.
 *   - `cargando`: indica si la carga inicial del historial está en curso.
 */
export function usarChat(peerId: string | undefined) {
  const { usuario } = usarSesion();
  const miId = usuario?.id ?? '';
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();

  // Mensajes recibidos en vivo por el socket durante esta sesión (aún no presentes en el
  // historial REST). Se mantienen en estado local y se fusionan con el historial al renderizar.
  const [vivos, setVivos] = useState<MensajeChat[]>([]);
  // Indica si el socket está conectado, para reflejarlo en la interfaz si procede.
  const [conectado, setConectado] = useState(false);
  // Bandera de control para evitar envíos duplicados por pulsaciones repetidas muy seguidas.
  const peticionEnvio = useRef(false);

  // Carga el historial de la conversación por REST. Solo se ejecuta si hay un `peerId` válido;
  // la `queryKey` incluye `peerId` para cachear cada conversación por separado.
  const consultaHistorial = useQuery({
    queryKey: ['chat', peerId],
    queryFn: () => apiChat.historial(peerId!),
    enabled: Boolean(peerId),
  });

  // Efecto que gestiona la suscripción al socket para esta conversación: se ejecuta al cambiar
  // de interlocutor y registra/limpia los listeners de los eventos de chat.
  useEffect(() => {
    if (!peerId) return;
    // Al cambiar de conversación, se descartan los mensajes en vivo de la anterior.
    setVivos([]);
    const socket = obtenerSocket();

    // Invalida las consultas de la bandeja y de notificaciones para que los contadores
    // (mensajes no leídos, badges) se recalculen contra el backend.
    const refrescarContadores = () => {
      clienteConsultas.invalidateQueries({ queryKey: ['conversaciones'] });
      clienteConsultas.invalidateQueries({ queryKey: ['notificaciones'] });
    };

    // Handler de conexión: marca el socket como conectado y se une a la sala de este peer
    // para empezar a recibir sus mensajes.
    const unirse = () => {
      setConectado(true);
      socket.emit('unirse_sala', peerId);
    };

    // Handler del evento 'nuevo_mensaje': añade el mensaje entrante a la lista de vivos.
    const alNuevo = (mensaje: MensajeChat) => {
      // Pertenece a esta conversación si lo envía el peer o yo mismo (eco de mi propio envío).
      if (mensaje.remitenteId !== peerId && mensaje.remitenteId !== miId) return;
      setVivos((previos) =>
        previos.some((m) => m.id === mensaje.id) ? previos : [...previos, mensaje],
      );
      if (mensaje.remitenteId === peerId) {
        apiChat.marcarLeida(peerId).catch(() => undefined);
        refrescarContadores();
      }
    };

    // Handler del evento 'error_chat': muestra un aviso al usuario si el servidor rechaza algo.
    const alError = (datos: { mensaje?: string }) => {
      brindis.error(datos?.mensaje ?? 'No se pudo enviar el mensaje');
    };

    // Handler de desconexión: refleja en la interfaz que el socket ya no está conectado.
    const alDesconectar = () => setConectado(false);

    // Si el socket ya estaba conectado al montar, se une de inmediato; en cualquier caso se
    // registran los listeners para futuras (re)conexiones y eventos entrantes.
    if (socket.connected) unirse();
    socket.on('connect', unirse);
    socket.on('nuevo_mensaje', alNuevo);
    socket.on('error_chat', alError);
    socket.on('disconnect', alDesconectar);

    // Marcar como leídos al abrir la conversación y refrescar los badges.
    apiChat.marcarLeida(peerId).catch(() => undefined).finally(refrescarContadores);

    // Limpieza: al desmontar o cambiar de conversación se retiran los listeners para no
    // acumular suscripciones duplicadas sobre el socket compartido.
    return () => {
      socket.off('connect', unirse);
      socket.off('nuevo_mensaje', alNuevo);
      socket.off('error_chat', alError);
      socket.off('disconnect', alDesconectar);
    };
  }, [peerId, miId, clienteConsultas, brindis]);

  // Historial REST + mensajes en vivo, sin duplicados, en orden cronológico.
  const mensajes = useMemo(() => {
    const mapa = new Map<string, MensajeChat>();
    (consultaHistorial.data ?? []).forEach((m) => mapa.set(m.id, m));
    vivos.forEach((m) => mapa.set(m.id, m));
    return Array.from(mapa.values()).sort((a, b) =>
      a.fechaCreacion.localeCompare(b.fechaCreacion),
    );
  }, [consultaHistorial.data, vivos]);

  /**
   * Envía un mensaje de texto al interlocutor actual a través del socket.
   *
   * @param contenido Texto del mensaje. Se recorta de espacios; si queda vacío, no hay `peerId`
   *   o existe un envío reciente en curso, la llamada se ignora.
   * @returns No devuelve nada; el mensaje aparecerá en la lista cuando el servidor reenvíe el
   *   eco `nuevo_mensaje`.
   */
  function enviar(contenido: string): void {
    const texto = contenido.trim();
    if (!texto || !peerId) return;
    // Evita envíos dobles por pulsaciones repetidas inmediatas.
    if (peticionEnvio.current) return;
    peticionEnvio.current = true;
    window.setTimeout(() => (peticionEnvio.current = false), 250);
    obtenerSocket().emit('enviar_mensaje', { disenadorId: peerId, contenido: texto });
  }

  return {
    mensajes,
    enviar,
    miId,
    conectado,
    cargando: consultaHistorial.isLoading && Boolean(peerId),
  };
}
