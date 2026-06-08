// Devuelve true si el usuario ha pedido reducir el movimiento (prefers-reduced-motion).
// Los componentes lo usan para desactivar transiciones que puedan marear. Accesibilidad (WCAG).
import { useEffect, useState } from 'react';

export function usarMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = (evento: MediaQueryListEvent) => setReducido(evento.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  return reducido;
}
