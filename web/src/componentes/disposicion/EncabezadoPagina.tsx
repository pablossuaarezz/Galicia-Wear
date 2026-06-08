// Encabezado editorial de página/sección: antetítulo, título serif y descripción opcional.
import type { ReactNode } from 'react';
import { cx } from '@/util/cx';

interface PropsEncabezado {
  titulo: string;
  descripcion?: string;
  antetitulo?: string;
  acciones?: ReactNode;
  className?: string;
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  antetitulo,
  acciones,
  className,
}: PropsEncabezado) {
  return (
    <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {antetitulo && (
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-atlantic-600">
            {antetitulo}
          </p>
        )}
        <h1 className="mt-1 font-editorial text-3xl font-semibold leading-tight text-tinta-900 sm:text-4xl">
          {titulo}
        </h1>
        {descripcion && <p className="mt-2 max-w-2xl text-tinta-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
