// Logotipo de marca GaliciaWear (vieira gallega). Usa los archivos oficiales del kit de marca:
// el wordmark (icono + "GALICIAWEAR") o solo el icono, en negro (fondos claros) o blanco
// (fondos oscuros). Enlaza al inicio.
import { Link } from 'react-router-dom';
import { cx } from '@/util/cx';

interface PropsMarca {
  className?: string;
  /** wordmark = icono + texto; icono = solo la vieira. */
  variante?: 'wordmark' | 'icono';
  /** negro para fondos claros, blanco para fondos oscuros. */
  color?: 'negro' | 'blanco';
  /** Altura en píxeles (el ancho se ajusta solo). */
  alto?: number;
  /** Alias retro-compatible de variante="icono". */
  soloIcono?: boolean;
}

export function Marca({ className, variante, color = 'negro', alto, soloIcono }: PropsMarca) {
  const tipo = variante ?? (soloIcono ? 'icono' : 'wordmark');
  const archivo = `/marca/${tipo === 'icono' ? 'icono' : 'wordmark'}-${color}.png`;
  const altura = alto ?? (tipo === 'icono' ? 44 : 38);

  return (
    <Link to="/" className={cx('inline-flex shrink-0 items-center', className)}>
      <img
        src={archivo}
        alt="GaliciaWear"
        style={{ height: altura }}
        className="w-auto select-none"
        draggable={false}
      />
    </Link>
  );
}
