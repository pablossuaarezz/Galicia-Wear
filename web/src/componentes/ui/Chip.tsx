// Chip seleccionable (filtros de catálogo). Estado visual via `activo` + aria-pressed.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/util/cx';

interface PropsChip extends ButtonHTMLAttributes<HTMLButtonElement> {
  activo?: boolean;
  iconoIzquierda?: ReactNode;
}

export function Chip({ activo = false, iconoIzquierda, className, children, ...resto }: PropsChip) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cx(
        // Chip de filtro Material (Widget.GaliciaWear.Chip): esquinas 12dp y borde celeste.
        'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-semibold',
        'transition-colors duration-200 ease-suave',
        activo
          ? 'border-atlantic-500 bg-atlantic-500 text-white shadow-suave'
          : 'border-celeste-300 bg-white text-atlantic-700 hover:border-celeste-500 hover:bg-atlantic-50',
        className,
      )}
      {...resto}
    >
      {iconoIzquierda}
      {children}
    </button>
  );
}
