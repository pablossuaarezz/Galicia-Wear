// Modal accesible (role=dialog, aria-modal): cierra con Escape o clic en el fondo, bloquea el
// scroll del cuerpo y devuelve el foco al panel. Animación con muelle suave (respeta reduced-motion).
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '@/util/cx';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';

interface PropsModal {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  className?: string;
}

/**
 * Diálogo modal accesible renderizado en un portal sobre el cuerpo del documento.
 * Gestiona el cierre con Escape/fondo, el bloqueo del scroll y el enfoque del panel.
 */
export function Modal({ abierto, alCerrar, titulo, descripcion, children, pie, className }: PropsModal) {
  const panel = useRef<HTMLDivElement>(null);
  const reducido = usarMovimientoReducido();
  const idTitulo = useId();

  // Mientras el modal está abierto: escucha Escape, bloquea el scroll del fondo y enfoca el panel.
  // La función de limpieza restaura el listener y el overflow previo al cerrar/desmontar.
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('keydown', alTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', alTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, alCerrar]);

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-tinta-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={alCerrar}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo ? idTitulo : undefined}
            initial={reducido ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducido ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cx(
              'relative z-10 w-full max-w-lg rounded-t-xl2 bg-white p-6 shadow-flotante outline-none sm:rounded-xl2',
              'max-h-[90vh] overflow-y-auto',
              className,
            )}
          >
            {titulo && (
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 id={idTitulo} className="font-display text-xl font-semibold text-tinta-900">
                    {titulo}
                  </h2>
                  {descripcion && <p className="mt-1 text-sm text-tinta-500">{descripcion}</p>}
                </div>
                <button
                  type="button"
                  onClick={alCerrar}
                  className="-mr-2 -mt-1 rounded-full p-2 text-tinta-400 transition-colors hover:bg-piedra-100 hover:text-tinta-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
            {children}
            {pie && <div className="mt-6 flex flex-wrap justify-end gap-3">{pie}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
