// Cierra menús/desplegables al hacer clic fuera o pulsar Escape.
//
// Hook de utilidad genérico para componentes de tipo menú desplegable, popover o modal
// ligero: detecta clics fuera del elemento referenciado y la tecla Escape, e invoca el
// callback de cierre proporcionado.
import { useEffect, type RefObject } from 'react';

/**
 * Escucha clics globales y la tecla Escape para cerrar un elemento (menú, desplegable, etc.)
 * cuando el usuario interactúa fuera de él.
 *
 * @typeParam T - Tipo del elemento HTML referenciado (p. ej. `HTMLDivElement`).
 * @param ref Referencia al elemento contenedor del menú/desplegable. Si el clic ocurre fuera
 *   de este elemento, se invoca `alCerrar`.
 * @param alCerrar Callback que se ejecuta para cerrar el elemento (clic fuera o tecla Escape).
 * @param activo Si es `false`, el hook no añade los listeners (útil para no escuchar eventos
 *   cuando el menú ya está cerrado). Por defecto `true`.
 * @returns No devuelve nada; solo gestiona los listeners mediante un efecto.
 */
export function usarClicFuera<T extends HTMLElement>(
  ref: RefObject<T>,
  alCerrar: () => void,
  activo = true,
): void {
  useEffect(() => {
    // Si el hook está desactivado, no se registran listeners (evita trabajo innecesario).
    if (!activo) return;

    // Si el clic ocurrió fuera del elemento referenciado, se cierra el menú/desplegable.
    const alClic = (evento: MouseEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) alCerrar();
    };

    // Permite cerrar también con la tecla Escape (accesibilidad).
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };

    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);

    // Limpieza: se eliminan los listeners al desmontar o cuando cambian las dependencias.
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [ref, alCerrar, activo]);
}
