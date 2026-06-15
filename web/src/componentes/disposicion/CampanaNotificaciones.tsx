// Campana de notificaciones: badge con el contador (sondeo cada 30 s) y panel desplegable con
// la bandeja. Al abrir un aviso se marca como leído y se navega al pedido relacionado.
//
// Se monta dentro de `BarraNavegacion`, únicamente cuando el usuario tiene sesión iniciada
// (clientes y diseñadores). El contador y la lista de notificaciones se obtienen mediante los
// hooks `usarContadorNotificaciones` y `usarNotificaciones` (basados en React Query u similar),
// que gestionan el sondeo periódico y la invalidación de caché.
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

/**
 * Botón de campana con insignia de notificaciones no leídas y panel desplegable con la bandeja.
 *
 * No recibe props. Internamente:
 * - `usarContadorNotificaciones` proporciona el número de notificaciones sin leer (sondeado
 *   periódicamente para mantenerlo actualizado sin recargar la página).
 * - `usarNotificaciones` proporciona la lista completa, el estado de carga y las acciones para
 *   marcar una o todas las notificaciones como leídas.
 * - El panel se cierra al hacer clic fuera de él (`usarClicFuera`) o tras seleccionar un aviso.
 */
export function CampanaNotificaciones() {
  // Controla la visibilidad del panel desplegable de notificaciones.
  const [abierto, setAbierto] = useState(false);
  // Referencia al contenedor para detectar clics fuera y cerrar el panel.
  const contenedor = useRef<HTMLDivElement>(null);
  const navegar = useNavigate();
  const { esDisenador } = usarSesion();
  // Contador de notificaciones no leídas (con valor por defecto 0 mientras carga).
  const { data: noLeidas = 0 } = usarContadorNotificaciones();
  const { notificaciones, cargando, marcarLeida, marcarTodas } = usarNotificaciones();

  // Cierra el panel automáticamente si el usuario hace clic fuera de él, solo cuando está abierto.
  usarClicFuera(contenedor, () => setAbierto(false), abierto);

  /**
   * Gestiona el clic sobre una notificación concreta: la marca como leída, cierra el panel y
   * navega a la pantalla relacionada según el tipo de notificación (mensaje nuevo o pedido).
   *
   * @param notif - La notificación seleccionada por el usuario.
   */
  function abrirAviso(notif: Notificacion) {
    marcarLeida(notif.id);
    setAbierto(false);
    // El campo `datos` es un objeto genérico (payload de la notificación); se valida el tipo de
    // cada propiedad antes de usarla, ya que su forma depende del tipo de notificación.
    const peerId = typeof notif.datos?.peerId === 'string' ? notif.datos.peerId : undefined;
    const pedidoId = typeof notif.datos?.pedidoId === 'string' ? notif.datos.pedidoId : undefined;
    const nombre = typeof notif.datos?.nombre === 'string' ? notif.datos.nombre : undefined;
    if (peerId) {
      // MENSAJE_NUEVO → abre la conversación con el remitente.
      navegar(`/mensajes/${peerId}`, { state: { nombre } });
    } else if (pedidoId) {
      // Notificación relacionada con un pedido: la ruta de destino depende del rol del usuario.
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
        {/* Insignia con el número de notificaciones no leídas; se anima al aparecer/cambiar. */}
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

      {/* Panel desplegable con la bandeja de notificaciones; se anima al abrir/cerrar. */}
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
