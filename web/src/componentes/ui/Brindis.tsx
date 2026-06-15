/* eslint-disable react-refresh/only-export-components */
// Sistema de "brindis" (toasts) global para feedback efímero. Patrón Provider + hook en el
// mismo archivo (idiomático para contextos); se desactiva react-refresh solo aquí.
//
// El "brindis" es una notificación flotante temporal (éxito, error o información) que
// aparece en la esquina inferior de la pantalla y se cierra automáticamente tras un
// tiempo determinado (o manualmente con el botón de cerrar). Se expone mediante un
// React Context: <ProveedorBrindis> envuelve la aplicación y el hook usarBrindis()
// permite a cualquier componente disparar mensajes.
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

/** Tipo semántico del brindis, determina el icono y los colores aplicados. */
export type TipoBrindis = 'exito' | 'error' | 'info';

/** Representación interna de un brindis activo en la cola. */
interface Brindis {
  /** Identificador único e incremental, usado como key de React y para cerrarlo individualmente. */
  id: number;
  /** Tipo semántico (éxito, error, información). */
  tipo: TipoBrindis;
  /** Texto del mensaje mostrado al usuario. */
  mensaje: string;
}

/**
 * Valor expuesto por el contexto de brindis: función genérica `mostrar` más
 * atajos semánticos para cada tipo (`exito`, `error`, `info`).
 */
interface ValorBrindis {
  /** Muestra un brindis genérico, indicando tipo y duración antes de auto-cerrarse. */
  mostrar: (mensaje: string, tipo?: TipoBrindis, duracionMs?: number) => void;
  /** Atajo para mostrar un brindis de tipo 'exito'. */
  exito: (mensaje: string) => void;
  /** Atajo para mostrar un brindis de tipo 'error'. */
  error: (mensaje: string) => void;
  /** Atajo para mostrar un brindis de tipo 'info'. */
  info: (mensaje: string) => void;
}

// Contexto de React que distribuye las funciones de notificación a toda la app.
// Su valor inicial es null para forzar el uso de usarBrindis() dentro del proveedor.
const ContextoBrindis = createContext<ValorBrindis | null>(null);

// Icono de lucide-react asociado a cada tipo de brindis.
const ICONOS: Record<TipoBrindis, typeof Info> = {
  exito: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

// Clases Tailwind de color (borde, fondo, texto) asociadas a cada tipo de brindis.
const ESTILOS: Record<TipoBrindis, string> = {
  exito: 'border-exito/30 bg-exito-suave text-exito-fuerte',
  error: 'border-peligro/30 bg-peligro-suave text-peligro-fuerte',
  info: 'border-atlantic-200 bg-atlantic-50 text-atlantic-700',
};

/**
 * Proveedor de contexto que gestiona la cola de brindis y renderiza el contenedor
 * flotante donde se muestran.
 *
 * Debe envolver el árbol de componentes de la aplicación (normalmente cerca de la raíz)
 * para que cualquier componente hijo pueda usar el hook {@link usarBrindis}.
 *
 * @param children Árbol de componentes de la aplicación.
 */
export function ProveedorBrindis({ children }: { children: ReactNode }) {
  // Cola de brindis actualmente visibles.
  const [brindis, setBrindis] = useState<Brindis[]>([]);
  // Contador para generar identificadores únicos incrementales sin necesidad de estado
  // (useRef evita renders adicionales al actualizarse).
  const contador = useRef(0);
  // Indica si el usuario prefiere movimiento reducido (accesibilidad), para simplificar
  // o desactivar las animaciones de entrada/salida.
  const reducido = usarMovimientoReducido();

  // Elimina un brindis de la cola por su id (cierre manual o automático por timeout).
  const cerrar = useCallback((id: number) => {
    setBrindis((actual) => actual.filter((b) => b.id !== id));
  }, []);

  // Añade un nuevo brindis a la cola y programa su cierre automático tras `duracionMs`.
  const mostrar = useCallback(
    (mensaje: string, tipo: TipoBrindis = 'info', duracionMs = 4000) => {
      const id = ++contador.current;
      setBrindis((actual) => [...actual, { id, tipo, mensaje }]);
      // Cierre automático: tras la duración indicada se elimina el brindis de la cola.
      window.setTimeout(() => cerrar(id), duracionMs);
    },
    [cerrar],
  );

  // Memoriza el valor del contexto para evitar renders innecesarios en los consumidores
  // cuando `mostrar` no cambia entre renders.
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
      {/* Contenedor flotante fijo en la esquina inferior (centrado en móvil, a la derecha en
          pantallas grandes). aria-live="polite" anuncia los nuevos brindis a lectores de
          pantalla sin interrumpir la lectura actual. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* AnimatePresence gestiona las animaciones de entrada/salida cuando se añaden o
            eliminan brindis de la cola. */}
        <AnimatePresence initial={false}>
          {brindis.map((b) => {
            const Icono = ICONOS[b.tipo];
            return (
              <motion.div
                key={b.id}
                // `layout` anima reposicionamientos al añadir/quitar elementos, salvo que
                // el usuario prefiera movimiento reducido.
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

/**
 * Hook para acceder a las funciones de notificación (`mostrar`, `exito`, `error`, `info`)
 * desde cualquier componente descendiente de {@link ProveedorBrindis}.
 *
 * @throws {Error} Si se invoca fuera del árbol de {@link ProveedorBrindis}.
 * @returns El objeto {@link ValorBrindis} con las funciones para disparar brindis.
 */
export function usarBrindis(): ValorBrindis {
  const contexto = useContext(ContextoBrindis);
  if (!contexto) throw new Error('usarBrindis debe usarse dentro de <ProveedorBrindis>');
  return contexto;
}
