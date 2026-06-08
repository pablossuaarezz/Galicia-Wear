/* eslint-disable react-refresh/only-export-components */
// Sistema de "brindis" (toasts) global para feedback efímero. Patrón Provider + hook en el
// mismo archivo (idiomático para contextos); se desactiva react-refresh solo aquí.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cx } from '@/util/cx';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';

export type TipoBrindis = 'exito' | 'error' | 'info';

interface Brindis {
  id: number;
  tipo: TipoBrindis;
  mensaje: string;
}

interface ValorBrindis {
  mostrar: (mensaje: string, tipo?: TipoBrindis, duracionMs?: number) => void;
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ContextoBrindis = createContext<ValorBrindis | null>(null);

const ICONOS: Record<TipoBrindis, typeof Info> = {
  exito: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ESTILOS: Record<TipoBrindis, string> = {
  exito: 'border-exito/30 bg-exito-suave text-exito-fuerte',
  error: 'border-peligro/30 bg-peligro-suave text-peligro-fuerte',
  info: 'border-atlantic-200 bg-atlantic-50 text-atlantic-700',
};

export function ProveedorBrindis({ children }: { children: ReactNode }) {
  const [brindis, setBrindis] = useState<Brindis[]>([]);
  const contador = useRef(0);
  const reducido = usarMovimientoReducido();

  const cerrar = useCallback((id: number) => {
    setBrindis((actual) => actual.filter((b) => b.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensaje: string, tipo: TipoBrindis = 'info', duracionMs = 4000) => {
      const id = ++contador.current;
      setBrindis((actual) => [...actual, { id, tipo, mensaje }]);
      window.setTimeout(() => cerrar(id), duracionMs);
    },
    [cerrar],
  );

  const valor = useMemo<ValorBrindis>(
    () => ({
      mostrar,
      exito: (mensaje) => mostrar(mensaje, 'exito'),
      error: (mensaje) => mostrar(mensaje, 'error'),
      info: (mensaje) => mostrar(mensaje, 'info'),
    }),
    [mostrar],
  );

  return (
    <ContextoBrindis.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {brindis.map((b) => {
            const Icono = ICONOS[b.tipo];
            return (
              <motion.div
                key={b.id}
                layout={!reducido}
                initial={reducido ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducido ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={cx(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl2 border px-4 py-3 shadow-flotante',
                  ESTILOS[b.tipo],
                )}
                role="status"
              >
                <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p className="flex-1 text-sm font-medium leading-snug">{b.mensaje}</p>
                <button
                  type="button"
                  onClick={() => cerrar(b.id)}
                  className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
                  aria-label="Cerrar aviso"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ContextoBrindis.Provider>
  );
}

export function usarBrindis(): ValorBrindis {
  const contexto = useContext(ContextoBrindis);
  if (!contexto) throw new Error('usarBrindis debe usarse dentro de <ProveedorBrindis>');
  return contexto;
}
