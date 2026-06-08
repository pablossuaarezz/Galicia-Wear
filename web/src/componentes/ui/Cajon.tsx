// Cajón lateral (drawer) deslizante, usado para los filtros del catálogo en móvil. Cierra con
// Escape o clic en el fondo y bloquea el scroll del cuerpo mientras está abierto.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '@/util/cx';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';

interface PropsCajon {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  children: ReactNode;
  pie?: ReactNode;
}

export function Cajon({ abierto, alCerrar, titulo, children, pie }: PropsCajon) {
  const panel = useRef<HTMLDivElement>(null);
  const reducido = usarMovimientoReducido();
  const idTitulo = useId();

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
        <div className="fixed inset-0 z-[90] flex justify-end">
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
            initial={reducido ? { opacity: 0 } : { x: '100%' }}
            animate={reducido ? { opacity: 1 } : { x: 0 }}
            exit={reducido ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-sm flex-col bg-sand-50 shadow-flotante outline-none"
          >
            <div className="flex items-center justify-between border-b border-piedra-100 px-5 py-4">
              <h2 id={idTitulo} className="font-display text-lg font-semibold text-tinta-900">
                {titulo}
              </h2>
              <button
                type="button"
                onClick={alCerrar}
                className="rounded-full p-2 text-tinta-400 transition-colors hover:bg-piedra-100 hover:text-tinta-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className={cx('flex-1 overflow-y-auto px-5 py-5')}>{children}</div>
            {pie && (
              <div className="border-t border-piedra-100 px-5 py-4">{pie}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
