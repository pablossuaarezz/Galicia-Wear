// Campana de notificaciones: badge con el contador (sondeo cada 30 s) y panel desplegable con
// la bandeja. Al abrir un aviso se marca como leído y se navega al pedido relacionado.
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { cx } from '@/util/cx';
import { usarClicFuera } from '@/hooks/usarClicFuera';
import { usarContadorNotificaciones, usarNotificaciones } from '@/hooks/usarNotificaciones';
import { usarSesion } from '@/contexto/ContextoSesion';
import { formatoTiempoRelativo } from '@/util/formatos';
import type { Notificacion } from '@/api/tipos';

export function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const navegar = useNavigate();
  const { esDisenador } = usarSesion();
  const { data: noLeidas = 0 } = usarContadorNotificaciones();
  const { notificaciones, cargando, marcarLeida, marcarTodas } = usarNotificaciones();

  usarClicFuera(contenedor, () => setAbierto(false), abierto);

  function abrirAviso(notif: Notificacion) {
    marcarLeida(notif.id);
    setAbierto(false);
    const peerId = typeof notif.datos?.peerId === 'string' ? notif.datos.peerId : undefined;
    const pedidoId = typeof notif.datos?.pedidoId === 'string' ? notif.datos.pedidoId : undefined;
    const nombre = typeof notif.datos?.nombre === 'string' ? notif.datos.nombre : undefined;
    if (peerId) {
      // MENSAJE_NUEVO → abre la conversación con el remitente.
      navegar(`/mensajes/${peerId}`, { state: { nombre } });
    } else if (pedidoId) {
      navegar(esDisenador ? '/panel/pedidos' : `/cuenta/pedidos/${pedidoId}`);
    }
  }

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-tinta-600 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ''}`}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <Bell className="h-5 w-5" aria-hidden />
        <AnimatePresence>
          {noLeidas > 0 && (
            <motion.span
              key={noLeidas}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-peligro px-1 text-[10px] font-bold text-white"
            >
              {noLeidas > 99 ? '99+' : noLeidas}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl2 border border-piedra-100 bg-white shadow-flotante"
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-piedra-100 px-4 py-3">
              <h2 className="font-display text-sm font-semibold text-tinta-800">Notificaciones</h2>
              {notificaciones.length > 0 && (
                <button
                  type="button"
                  onClick={() => marcarTodas()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-atlantic-600 hover:text-atlantic-800"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {cargando ? (
                <p className="px-4 py-8 text-center text-sm text-tinta-400">Cargando…</p>
              ) : notificaciones.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-tinta-400">
                  No tienes notificaciones todavía.
                </p>
              ) : (
                <ul>
                  {notificaciones.map((n) => {
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => abrirAviso(n)}
                          className={cx(
                            'flex w-full gap-3 border-b border-piedra-50 px-4 py-3 text-left transition-colors hover:bg-sand-50',
                            !n.leida && 'bg-atlantic-50/50',
                          )}
                        >
                          <span
                            className={cx(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              n.leida ? 'bg-transparent' : 'bg-atlantic-500',
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-tinta-800">
                              {n.titulo}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-tinta-500">
                              {n.cuerpo}
                            </span>
                            <span className="mt-1 block text-[11px] text-tinta-400">
                              {formatoTiempoRelativo(n.fechaCreacion)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
