// Paginador sencillo y accesible: anterior / indicador / siguiente. Oculto si hay una sola página.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/util/cx';

interface PropsPaginador {
  pagina: number;
  total: number;
  limite: number;
  alCambiar: (pagina: number) => void;
}

export function Paginador({ pagina, total, limite, alCambiar }: PropsPaginador) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  if (totalPaginas <= 1) return null;

  const claseBoton =
    'inline-flex h-10 items-center gap-1 rounded-full border border-piedra-200 bg-white px-4 text-sm font-medium ' +
    'text-tinta-700 transition-colors hover:border-atlantic-300 hover:text-atlantic-700 ' +
    'disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Paginación del catálogo">
      <button
        type="button"
        className={cx(claseBoton)}
        onClick={() => alCambiar(pagina - 1)}
        disabled={pagina <= 1}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Anterior
      </button>
      <span className="text-sm tabular-nums text-tinta-500" aria-live="polite">
        Página <span className="font-semibold text-tinta-800">{pagina}</span> de {totalPaginas}
      </span>
      <button
        type="button"
        className={cx(claseBoton)}
        onClick={() => alCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
