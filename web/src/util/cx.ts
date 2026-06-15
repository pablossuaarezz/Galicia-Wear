// Utilidad de composición de clases CSS de Tailwind. Combina la condicionalidad de `clsx`
// (acepta strings, arrays, objetos {clase: booleano}…) con la resolución de conflictos de
// `tailwind-merge` (cuando dos utilidades chocan, prevalece la última declarada). Evita así
// duplicados incoherentes como "px-2 px-4", que quedaría reducido a "px-4". Es el patrón
// estándar en proyectos React + Tailwind y se reutiliza en todos los componentes de la UI.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compone una lista variádica de clases de Tailwind en una única cadena, resolviendo
 * conflictos entre utilidades (gana la última) y filtrando valores falsy/condicionales.
 *
 * @param clases - Lista de valores de clase (strings, arrays u objetos condicionales).
 * @returns Cadena de clases CSS lista para el atributo `className`, ya deduplicada.
 */
export function cx(...clases: ClassValue[]): string {
  // clsx normaliza/condiciona la entrada y twMerge resuelve los choques entre utilidades.
  return twMerge(clsx(clases));
}
