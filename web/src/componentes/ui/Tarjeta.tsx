// Contenedor de tarjeta: superficie blanca con borde tenue y sombra suave.
import type { HTMLAttributes } from 'react';
import { cx } from '@/util/cx';

export function Tarjeta({ className, children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-xl2 border border-piedra-100 bg-white shadow-suave', className)}
      {...resto}
    >
      {children}
    </div>
  );
}
