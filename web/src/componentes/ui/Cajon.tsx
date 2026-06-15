// Cajón lateral (drawer) deslizante, usado para los filtros del catálogo en móvil. Cierra con
// Escape o clic en el fondo y bloquea el scroll del cuerpo mientras está abierto.
//
// Componente UI reutilizable que despliega un panel desde el borde derecho de la pantalla
// mediante un portal de React (renderizado fuera del árbol DOM padre, directamente en
// document.body). Implementa un patrón de diálogo modal accesible: atrapa el foco en el
// panel, bloquea el desplazamiento de la página de fondo y se anuncia a lectores de pantalla
// con role="dialog" y aria-modal. Las animaciones de entrada/salida respetan la preferencia
// del usuario de movimiento reducido.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '@/util/cx';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';

/**
 * Props del componente {@link Cajon}.
 */
interface PropsCajon {
  /** Controla la visibilidad del cajón: cuando es true, el panel se monta y anima su entrada. */
  abierto: boolean;
  /** Callback invocado cuando el usuario solicita cerrar (Escape, clic en el fondo o botón de cerrar). */
  alCerrar: () => void;
  /** Título mostrado en la cabecera del cajón; si se omite, no se renderiza la cabecera con título. */
  titulo?: string;
  /** Contenido principal del cajón (cuerpo desplazable). */
  children: ReactNode;
  /** Contenido opcional fijado en el pie del cajón (por ejemplo, botones de acción). */
  pie?: ReactNode;
}

/**
 * Cajón lateral (drawer) modal reutilizable del sistema de diseño.
 *
 * Renderiza, mediante un portal en document.body, un panel deslizante anclado al borde
 * derecho junto con un fondo semitransparente que oscurece el resto de la interfaz.
 * Gestiona el cierre por tecla Escape, el bloqueo del scroll del cuerpo y la entrega del
 * foco al panel al abrirse.
 */
export function Cajon({ abierto, alCerrar, titulo, children, pie }: PropsCajon) {
  // Referencia al panel para poder darle el foco al abrir el cajón (accesibilidad de teclado).
  const panel = useRef<HTMLDivElement>(null);
  // Indica si el usuario prefiere movimiento reducido, para simplificar las animaciones.
  const reducido = usarMovimientoReducido();
  // Identificador único para enlazar el título con el contenedor del diálogo (aria-labelledby).
  const idTitulo = useId();

  useEffect(() => {
    // Si el cajón está cerrado no se instala ningún listener ni se bloquea el scroll.
    if (!abierto) return;
    // Cierre por teclado: la tecla Escape dispara el callback de cierre.
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('keydown', alTecla);
    // Se guarda el valor previo de overflow para restaurarlo al cerrar, evitando el scroll de fondo.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Se traslada el foco al panel para que la navegación con teclado quede contenida en el diálogo.
    panel.current?.focus();
    return () => {
      // Limpieza: se elimina el listener y se restaura el overflow original del cuerpo.
      document.removeEventListener('keydown', alTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, alCerrar]);

  // createPortal monta el cajón directamente en document.body, fuera de la jerarquía del padre,
  // garantizando que se superponga correctamente sobre el resto de la interfaz.
  return createPortal(
    // AnimatePresence permite animar la salida del panel antes de desmontarlo del DOM.
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Fondo oscuro semitransparente con desenfoque; un clic sobre él cierra el cajón. */}
          <motion.div
            className="absolute inset-0 bg-tinta-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={alCerrar}
          />
          {/* Panel del diálogo. tabIndex={-1} permite enfocarlo por código sin incluirlo en el
              orden de tabulación natural. role/aria-modal/aria-labelledby lo exponen como diálogo modal. */}
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo ? idTitulo : undefined}
            // Sin movimiento reducido el panel se desliza horizontalmente desde fuera de pantalla;
            // con movimiento reducido se usa un simple desvanecimiento.
            initial={reducido ? { opacity: 0 } : { x: '100%' }}
            animate={reducido ? { opacity: 1 } : { x: 0 }}
            exit={reducido ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-sm flex-col bg-sand-50 shadow-flotante outline-none"
          >
            {/* Cabecera fija con el título del cajón y el botón de cerrar. */}
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
            {/* Cuerpo desplazable que ocupa el espacio restante (flex-1) entre cabecera y pie. */}
            <div className={cx('flex-1 overflow-y-auto px-5 py-5')}>{children}</div>
            {/* Pie opcional, separado por un borde; típicamente contiene acciones (aplicar, limpiar). */}
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
