// Bandeja de conversaciones del chat: avatar, nombre, último mensaje y badge de no leídos.
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Avatar, EstadoVacio, Esqueleto } from '@/componentes/ui';
import { usarConversaciones } from '@/hooks/usarConversaciones';
import { formatoTiempoRelativo } from '@/util/formatos';
import { cx } from '@/util/cx';

/**
 * Bandeja lateral con la lista de conversaciones del usuario, ordenadas por el hook
 * `usarConversaciones` (típicamente por fecha del último mensaje).
 *
 * Cada elemento muestra el avatar del interlocutor, su nombre, el texto del último mensaje,
 * el tiempo relativo desde ese mensaje y un contador de mensajes no leídos (si los hay).
 * El elemento correspondiente a la conversación abierta actualmente se resalta.
 *
 * @param peerActivo - Identificador del interlocutor de la conversación abierta actualmente
 *                      (para resaltar el elemento correspondiente en la lista).
 * @returns Lista de conversaciones, esqueletos de carga o estado vacío según corresponda.
 */
export function ListaConversaciones({ peerActivo }: { peerActivo?: string }) {
  const { data: conversaciones = [], isLoading } = usarConversaciones();

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (conversaciones.length === 0) {
    return (
      <div className="p-6">
        <EstadoVacio
          icono={<MessageCircle className="h-6 w-6" />}
          titulo="Sin conversaciones"
          descripcion="Cuando escribas a una tienda (o un cliente te escriba), aparecerá aquí."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-piedra-100">
      {conversaciones.map((conversacion) => (
        <li key={conversacion.peerId}>
          <Link
            to={`/mensajes/${conversacion.peerId}`}
            state={{ nombre: conversacion.nombre }}
            className={cx(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              conversacion.peerId === peerActivo ? 'bg-atlantic-50' : 'hover:bg-sand-50',
            )}
          >
            <Avatar nombre={conversacion.nombre} tamano={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-display text-sm font-semibold text-tinta-900">
                  {conversacion.nombre}
                </p>
                <span className="shrink-0 text-[11px] text-tinta-400">
                  {formatoTiempoRelativo(conversacion.fechaUltimo)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p
                  className={cx(
                    'truncate text-sm',
                    conversacion.noLeidos > 0 ? 'font-medium text-tinta-700' : 'text-tinta-400',
                  )}
                >
                  {conversacion.ultimoMensaje}
                </p>
                {conversacion.noLeidos > 0 && (
                  // El contador de no leídos se trunca a "99+" para no desbordar el badge.
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-atlantic-500 px-1.5 text-[11px] font-bold text-white">
                    {conversacion.noLeidos > 99 ? '99+' : conversacion.noLeidos}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
