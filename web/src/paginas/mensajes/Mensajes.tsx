// Mensajes: bandeja de conversaciones + hilo activo (dos columnas en escritorio; en móvil se ve
// la lista, y al abrir una conversación se ve el hilo a pantalla completa con botón de volver).
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { Tarjeta } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { EncabezadoPagina } from '@/componentes/disposicion/EncabezadoPagina';
import { ListaConversaciones } from '@/componentes/chat/ListaConversaciones';
import { HiloChat } from '@/componentes/chat/HiloChat';
import { usarConversaciones } from '@/hooks/usarConversaciones';
import { usarTitulo } from '@/hooks/usarTitulo';
import { cx } from '@/util/cx';

export default function Mensajes() {
  usarTitulo('Mensajes');
  const { peerId } = useParams<{ peerId: string }>();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const { data: conversaciones = [] } = usarConversaciones();

  const nombreEstado = (ubicacion.state as { nombre?: string } | null)?.nombre;
  const nombrePeer = conversaciones.find((c) => c.peerId === peerId)?.nombre ?? nombreEstado;

  return (
    <ContenedorPagina ancho="ancho" className="py-8">
      <EncabezadoPagina
        antetitulo="Soporte"
        titulo="Mensajes"
        descripcion="Habla con las tiendas sobre sus prendas. El chat es entre cliente y diseñador."
      />

      <Tarjeta className="mt-6 overflow-hidden p-0">
        <div className="grid h-[calc(100vh-16rem)] min-h-[28rem] md:grid-cols-[20rem_1fr]">
          <aside
            className={cx(
              'overflow-y-auto border-piedra-100 md:border-r',
              peerId ? 'hidden md:block' : 'block',
            )}
          >
            <ListaConversaciones peerActivo={peerId} />
          </aside>

          <section className={cx('min-w-0', peerId ? 'block' : 'hidden md:block')}>
            {peerId ? (
              <HiloChat
                key={peerId}
                peerId={peerId}
                nombrePeer={nombrePeer}
                alVolver={() => navegar('/mensajes')}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-tinta-400">
                <MessagesSquare className="h-12 w-12 text-atlantic-200" aria-hidden />
                <p className="mt-3 font-display text-sm font-medium text-tinta-500">
                  Selecciona una conversación
                </p>
              </div>
            )}
          </section>
        </div>
      </Tarjeta>
    </ContenedorPagina>
  );
}
