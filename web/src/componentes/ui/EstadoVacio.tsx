// Estado vacío reutilizable (carrito vacío, sin pedidos, sin resultados…). Icono + mensaje + CTA.
import type { ReactNode } from 'react';
import { cx } from '@/util/cx';

interface PropsEstadoVacio {
  icono?: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}

export function EstadoVacio({ icono, titulo, descripcion, accion, className }: PropsEstadoVacio) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-xl2 border border-dashed border-piedra-200 bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icono && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-atlantic-50 text-atlantic-500">
          {icono}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-tinta-800">{titulo}</h3>
      {descripcion && <p className="mt-1.5 max-w-sm text-sm text-tinta-500">{descripcion}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
