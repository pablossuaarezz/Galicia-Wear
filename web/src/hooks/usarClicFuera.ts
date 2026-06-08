// Cierra menús/desplegables al hacer clic fuera o pulsar Escape.
import { useEffect, type RefObject } from 'react';

export function usarClicFuera<T extends HTMLElement>(
  ref: RefObject<T>,
  alCerrar: () => void,
  activo = true,
): void {
  useEffect(() => {
    if (!activo) return;
    const alClic = (evento: MouseEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) alCerrar();
    };
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [ref, alCerrar, activo]);
}
