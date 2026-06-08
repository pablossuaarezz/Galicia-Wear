// Avatar circular: muestra la imagen (URL o data URI base64) o, en su defecto, las iniciales
// sobre un fondo atlántico. Las fotos de cliente llegan como data URI desde el perfil.
import { useState } from 'react';
import { cx } from '@/util/cx';

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '·';
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p.charAt(0).toUpperCase()).join('') || '·';
}

interface PropsAvatar {
  nombre?: string | null;
  url?: string | null;
  tamano?: number;
  className?: string;
}

export function Avatar({ nombre, url, tamano = 40, className }: PropsAvatar) {
  const [falla, setFalla] = useState(false);
  const mostrarImagen = Boolean(url) && !falla;

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-atlantic-100 font-display font-semibold text-atlantic-700',
        className,
      )}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.4 }}
      aria-hidden={!nombre}
    >
      {mostrarImagen ? (
        <img
          src={url ?? undefined}
          alt={nombre ? `Foto de ${nombre}` : ''}
          className="h-full w-full object-cover"
          onError={() => setFalla(true)}
        />
      ) : (
        iniciales(nombre)
      )}
    </span>
  );
}
