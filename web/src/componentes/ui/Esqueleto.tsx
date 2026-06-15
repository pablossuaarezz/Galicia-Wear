// Esqueleto de carga con efecto "shimmer" (se neutraliza con prefers-reduced-motion vía CSS).
import { cx } from '@/util/cx';

/** Marcador de posición animado (skeleton) para mostrar mientras se cargan los datos. */
export function Esqueleto({ className }: { className?: string }) {
  return (
    <span
      className={cx('relative block overflow-hidden rounded-md bg-piedra-100', className)}
      aria-hidden
    >
      <span className="absolute inset-0 -translate-x-full animate-brillo bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}
