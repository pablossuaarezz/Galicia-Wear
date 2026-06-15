// Indicador de carga circular. Tamaño en píxeles; hereda el color del texto (currentColor).
import { cx } from '@/util/cx';

/** Spinner SVG animado; `tamano` en píxeles y color heredado del texto (currentColor). */
export function Spinner({ tamano = 18, className }: { tamano?: number; className?: string }) {
  return (
    <svg
      className={cx('animate-spin', className)}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Cargando"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
