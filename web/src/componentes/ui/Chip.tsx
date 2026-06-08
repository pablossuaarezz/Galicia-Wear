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
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium',
        'transition-colors duration-200 ease-suave',
        activo
          ? 'border-atlantic-500 bg-atlantic-500 text-white shadow-suave'
          : 'border-piedra-200 bg-white text-tinta-600 hover:border-atlantic-300 hover:text-atlantic-700',
        className,
      )}
      {...resto}
    >
      {iconoIzquierda}
      {children}
    </button>
  );
}
