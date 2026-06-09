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

export function usarChat(peerId: string | undefined) {
  const { usuario } = usarSesion();
  const miId = usuario?.id ?? '';
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();

  const [vivos, setVivos] = useState<MensajeChat[]>([]);
  const [conectado, setConectado] = useState(false);
  const peticionEnvio = useRef(false);

  const consultaHistorial = useQuery({
    queryKey: ['chat', peerId],
    queryFn: () => apiChat.historial(peerId!),
    enabled: Boolean(peerId),
  });

  useEffect(() => {
    if (!peerId) return;
    setVivos([]);
    const socket = obtenerSocket();

    const refrescarContadores = () => {
      clienteConsultas.invalidateQueries({ queryKey: ['conversaciones'] });
      clienteConsultas.invalidateQueries({ queryKey: ['notificaciones'] });
    };

    const unirse = () => {
      setConectado(true);
      socket.emit('unirse_sala', peerId);
    };

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

    const alError = (datos: { mensaje?: string }) => {
      brindis.error(datos?.mensaje ?? 'No se pudo enviar el mensaje');
    };

    const alDesconectar = () => setConectado(false);

    if (socket.connected) unirse();
    socket.on('connect', unirse);
    socket.on('nuevo_mensaje', alNuevo);
    socket.on('error_chat', alError);
    socket.on('disconnect', alDesconectar);

    // Marcar como leídos al abrir la conversación y refrescar los badges.
    apiChat.marcarLeida(peerId).catch(() => undefined).finally(refrescarContadores);

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
