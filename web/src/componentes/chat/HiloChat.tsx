// Hilo de una conversación: cabecera con el peer, burbujas de mensaje (las mías a la derecha en
// azul, las del peer a la izquierda) con autoscroll, y caja de envío (Enter para enviar).
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar, Spinner } from '@/componentes/ui';
import { usarChat } from '@/hooks/usarChat';
import { formatoHora } from '@/util/formatos';
import { cx } from '@/util/cx';

interface PropsHiloChat {
  /** Identificador del usuario con el que se mantiene la conversación. */
  peerId: string;
  /** Nombre del interlocutor a mostrar en la cabecera, si ya se conoce. */
  nombrePeer?: string;
  /** Callback opcional para volver a la lista de conversaciones (botón visible solo en móvil). */
  alVolver?: () => void;
}

/**
 * Hilo de conversación de chat en tiempo real (vía Socket.IO, gestionado por `usarChat`).
 *
 * Renderiza la cabecera con el avatar y estado de conexión del interlocutor, el historial de
 * mensajes en burbujas (las propias alineadas a la derecha en azul, las del interlocutor a la
 * izquierda), con autoscroll automático al recibir o enviar mensajes, y una caja de texto que
 * permite enviar con Enter (Shift+Enter para salto de línea).
 *
 * @param peerId - Identificador del interlocutor de la conversación.
 * @param nombrePeer - Nombre a mostrar para el interlocutor (si se conoce de antemano).
 * @param alVolver - Callback para volver atrás (uso en vista móvil).
 * @returns Panel de chat completo (cabecera, mensajes y formulario de envío).
 */
export function HiloChat({ peerId, nombrePeer, alVolver }: PropsHiloChat) {
  const { mensajes, enviar, miId, conectado, cargando } = usarChat(peerId);
  const [texto, setTexto] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  // Nombre a mostrar: el que viene de la bandeja/estado o, en su defecto, el de un mensaje del peer.
  const nombre =
    nombrePeer || mensajes.find((m) => m.remitenteId === peerId)?.remitenteNombre || 'Conversación';

  // Autoscroll al final cuando llegan o se envían mensajes.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes.length]);

  /** Envía el mensaje actual (si no está vacío) a través del socket y limpia el campo de texto. */
  function mandar(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;
    enviar(texto);
    setTexto('');
  }

  /** Permite enviar el mensaje con Enter; Shift+Enter inserta un salto de línea normal. */
  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      mandar(evento);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <header className="flex items-center gap-3 border-b border-piedra-100 bg-white px-4 py-3">
        {alVolver && (
          <button
            type="button"
            onClick={alVolver}
            className="-ml-1 rounded-full p-1.5 text-tinta-500 transition-colors hover:bg-sand-100 md:hidden"
            aria-label="Volver a conversaciones"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
        <Avatar nombre={nombre} tamano={40} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-tinta-900">{nombre}</p>
          <p className="text-xs text-tinta-400">{conectado ? 'En línea' : 'Conectando…'}</p>
        </div>
      </header>

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-sand-50 px-4 py-4">
        {cargando ? (
          <div className="flex h-full items-center justify-center text-atlantic-400">
            <Spinner tamano={26} />
          </div>
        ) : mensajes.length === 0 ? (
          <p className="mt-8 text-center text-sm text-tinta-400">
            Aún no hay mensajes. ¡Escribe el primero!
          </p>
        ) : (
          mensajes.map((mensaje) => {
            // Determina si el mensaje lo envió el usuario actual, para alinearlo a la derecha
            // y aplicarle el estilo de burbuja "propia" (fondo azul).
            const mio = mensaje.remitenteId === miId;
            return (
              <div key={mensaje.id} className={cx('flex', mio ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-suave',
                    mio
                      ? 'rounded-br-md bg-atlantic-500 text-white'
                      : 'rounded-bl-md border border-piedra-100 bg-white text-tinta-800',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                  <p className={cx('mt-0.5 text-right text-[10px]', mio ? 'text-white/70' : 'text-tinta-400')}>
                    {formatoHora(mensaje.fechaCreacion)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={finRef} />
      </div>

      {/* Envío */}
      <form onSubmit={mandar} className="flex items-end gap-2 border-t border-piedra-100 bg-white p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={alTeclear}
          rows={1}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-piedra-200 bg-sand-50 px-4 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-400 focus:border-atlantic-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-atlantic-500/30"
        />
        <button
          type="submit"
          disabled={!texto.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-atlantic-500 text-white transition-colors hover:bg-atlantic-600 disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
