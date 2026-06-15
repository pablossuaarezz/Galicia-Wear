// Devuelve true si el usuario ha pedido reducir el movimiento (prefers-reduced-motion).
// Los componentes lo usan para desactivar transiciones que puedan marear. Accesibilidad (WCAG).
//
// Este hook lee la media query del sistema operativo/navegador `prefers-reduced-motion` y se
// suscribe a sus cambios, de modo que la interfaz pueda desactivar animaciones o transiciones
// no esenciales para usuarios sensibles al movimiento (cumplimiento de pautas WCAG).
import { useEffect, useState } from 'react';

/**
 * Indica si el usuario ha activado la preferencia de "reducir movimiento" en su sistema.
 *
 * @returns `true` si la media query `(prefers-reduced-motion: reduce)` coincide (el usuario
 *   prefiere menos animaciones); `false` en caso contrario o si `window.matchMedia` no está
 *   disponible (p. ej. en entornos sin DOM, como SSR o tests).
 */
export function usarMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(() => {
    // Comprobación defensiva: en entornos sin `window` (SSR) o sin `matchMedia`, se asume
    // que no hay preferencia de movimiento reducido.
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Si el usuario cambia la preferencia en el sistema en caliente, se actualiza el estado.
    const alCambiar = (evento: MediaQueryListEvent) => setReducido(evento.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  return reducido;
}
