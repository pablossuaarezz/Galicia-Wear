// Logotipo de la marca: olas atlánticas + nombre. Enlaza al inicio.
import { Link } from 'react-router-dom';
import { cx } from '@/util/cx';

function OlasMarca({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-atlantic-400 to-atlantic-700 text-white shadow-suave',
        className,
      )}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
        <path
          d="M8 40c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 10 5 5-5 8-5"
          stroke="#eef6fb"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M8 50c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 10 5 5-5 8-5"
          stroke="#b0d4ec"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M41 12c-9 1-15 7-15 15 0 1 .1 2 .3 3 8 .5 15.7-5.6 16.7-15 .1-1 0-2-.2-3z"
          fill="#9cc684"
        />
      </svg>
    </span>
  );
}

export function Marca({ className, soloIcono = false }: { className?: string; soloIcono?: boolean }) {
  return (
    <Link
      to="/"
      className={cx('inline-flex items-center gap-2.5', className)}
      aria-label="GaliciaWear — inicio"
    >
      <OlasMarca />
      {!soloIcono && (
        <span className="font-display text-lg font-extrabold tracking-tight text-atlantic-900">
          Galicia<span className="text-galego-600">Wear</span>
        </span>
      )}
    </Link>
  );
}
