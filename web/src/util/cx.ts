// Compone clases de Tailwind resolviendo conflictos (la última gana). Evita duplicados como
// "px-2 px-4" → "px-4". Patrón estándar clsx + tailwind-merge.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cx(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}
