// Disposición raíz del storefront: barra de navegación + contenido animado por ruta + pie.
// Incluye enlace "saltar al contenido" (accesibilidad) y scroll al inicio al cambiar de ruta.
import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';
import { BarraNavegacion } from './BarraNavegacion';
import { PieDePagina } from './PieDePagina';

export function DisposicionPrincipal() {
  const ubicacion = useLocation();
  const outlet = useOutlet();
  const reducido = usarMovimientoReducido();

  // Devuelve el scroll al inicio en cada navegación (salvo cambios solo de query).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [ubicacion.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-atlantic-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <BarraNavegacion />

      <main id="contenido" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={ubicacion.pathname}
            initial={reducido ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducido ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <PieDePagina />
    </div>
  );
}
