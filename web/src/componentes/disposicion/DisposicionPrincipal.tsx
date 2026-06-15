// Disposición raíz del storefront: barra de navegación + contenido animado por ruta + pie.
// Incluye enlace "saltar al contenido" (accesibilidad) y scroll al inicio al cambiar de ruta.
//
// Es el componente de layout de nivel superior de toda la aplicación web: lo monta el enrutador
// como elemento padre de prácticamente todas las rutas. Fija la barra de navegación arriba y el
// pie abajo (ambos persistentes entre navegaciones) y anima la transición del contenido central.
import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';
import { BarraNavegacion } from './BarraNavegacion';
import { PieDePagina } from './PieDePagina';

/**
 * Estructura raíz de la interfaz (cabecera fija, contenido animado y pie).
 *
 * No recibe props. Obtiene la ruta actual con `useLocation`, el contenido de la ruta hija con
 * `useOutlet` y la preferencia de movimiento reducido del sistema con `usarMovimientoReducido`
 * (para desactivar el desplazamiento de las animaciones por accesibilidad).
 */
export function DisposicionPrincipal() {
  const ubicacion = useLocation();
  // `useOutlet` devuelve el elemento de la ruta hija como variable, en lugar de renderizarlo
  // directamente como hace `<Outlet />`; así podemos envolverlo en la animación de transición.
  const outlet = useOutlet();
  // `true` si el usuario ha activado "reducir movimiento" en su sistema operativo.
  const reducido = usarMovimientoReducido();

  // Animamos la transición por sección de primer nivel (/catalogo, /cuenta, …): así cambiar de
  // sub-pestaña dentro de cuenta o panel no re-monta la disposición lateral (sin parpadeos).
  const segmento = '/' + (ubicacion.pathname.split('/')[1] ?? '');

  // Devuelve el scroll al inicio en cada navegación (salvo cambios solo de query).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [ubicacion.pathname]);

  return (
    // Columna a pantalla completa: la cabecera y el pie quedan en los extremos y el <main>
    // ocupa el espacio restante (`flex-1`), empujando el pie al fondo aunque haya poco contenido.
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* Enlace de salto para accesibilidad: invisible salvo al recibir foco con el teclado
          (`sr-only` + `focus:not-sr-only`); permite saltar la navegación e ir al contenido. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-atlantic-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <BarraNavegacion />

      {/* `id="contenido"` es el destino del enlace de salto anterior. */}
      <main id="contenido" className="flex-1">
        {/* `mode="wait"` espera a que termine la animación de salida antes de animar la entrada
            de la nueva sección; `initial={false}` evita animar en la primera carga. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            // La `key` por segmento hace que la animación se dispare solo al cambiar de sección
            // de primer nivel, no entre sub-rutas de la misma sección.
            key={segmento}
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
