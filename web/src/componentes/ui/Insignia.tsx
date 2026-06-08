// Insignia (badge) de estado/etiqueta con tonos semánticos.
import type { HTMLAttributes } from 'react';
import { cx } from '@/util/cx';

export type TonoInsignia = 'neutro' | 'info' | 'exito' | 'aviso' | 'peligro' | 'galego';

const TONOS: Record<TonoInsignia, string> = {
  neutro: 'bg-piedra-100 text-tinta-600',
  info: 'bg-atlantic-50 text-atlantic-700',
  exito: 'bg-exito-suave text-exito-fuerte',
  aviso: 'bg-aviso-suave text-aviso-fuerte',
  peligro: 'bg-peligro-suave text-peligro-fuerte',
  galego: 'bg-galego-50 text-galego-700',
};

interface PropsInsignia extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoInsignia;
}

export function Insignia({ tono = 'neutro', className, children, ...resto }: PropsInsignia) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONOS[tono],
        className,
      )}
      {...resto}
    >
      {children}
    </span>
  );
}
