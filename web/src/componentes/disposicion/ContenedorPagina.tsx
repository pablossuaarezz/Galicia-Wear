// Contenedor central con anchos máximos y padding lateral responsive.
import type { HTMLAttributes } from 'react';
import { cx } from '@/util/cx';

interface PropsContenedor extends HTMLAttributes<HTMLDivElement> {
  ancho?: 'estrecho' | 'normal' | 'ancho';
}

const ANCHOS = {
  estrecho: 'max-w-3xl',
  normal: 'max-w-6xl',
  ancho: 'max-w-7xl',
};

export function ContenedorPagina({ ancho = 'normal', className, children, ...resto }: PropsContenedor) {
  return (
    <div className={cx('mx-auto w-full px-4 sm:px-6 lg:px-8', ANCHOS[ancho], className)} {...resto}>
      {children}
    </div>
  );
}
