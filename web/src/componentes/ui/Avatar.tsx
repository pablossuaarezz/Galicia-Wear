// Avatar circular: muestra la imagen (URL o data URI base64) o, en su defecto, las iniciales
// sobre un fondo atlántico. Las fotos de cliente llegan como data URI desde el perfil.
//
// Componente UI reutilizable que representa la identidad visual de un usuario: si dispone de
// imagen la muestra recortada en un círculo; si no, calcula las iniciales del nombre y las
// pinta sobre un degradado de marca. Si la imagen falla al cargar, se hace fallback a las
// iniciales automáticamente.
import { useState } from 'react';
import { cx } from '@/util/cx';

/**
 * Calcula las iniciales (máximo 2 letras) a partir de un nombre completo.
 * Si no se proporciona nombre, devuelve un carácter neutro ('·') como marcador.
 *
 * @param nombre Nombre completo del usuario (puede venir nulo o indefinido).
 * @returns Cadena con hasta 2 iniciales en mayúsculas, o '·' si no hay nombre.
 */
function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '·';
  // Se separa por espacios, se toman como máximo las dos primeras palabras
  // (normalmente nombre y primer apellido) y se extrae la primera letra de cada una.
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p.charAt(0).toUpperCase()).join('') || '·';
}

/**
 * Props del componente {@link Avatar}.
 */
interface PropsAvatar {
  /** Nombre completo del usuario, usado para generar iniciales y el texto alternativo de la imagen. */
  nombre?: string | null;
  /** URL o data URI (base64) de la foto de perfil. Si es nula/indefinida o falla, se muestran las iniciales. */
  url?: string | null;
  /** Tamaño del avatar en píxeles (ancho y alto, ya que es circular). Por defecto 40px. */
  tamano?: number;
  /** Clases CSS adicionales para personalizar el contenedor. */
  className?: string;
}

/**
 * Avatar circular reutilizable del sistema de diseño.
 *
 * Renderiza la foto de perfil del usuario si está disponible y carga correctamente;
 * en caso contrario, muestra las iniciales del nombre sobre un fondo con degradado
 * de marca (azul atlántico → celeste).
 */
export function Avatar({ nombre, url, tamano = 40, className }: PropsAvatar) {
  // Estado interno: indica si la carga de la imagen ha fallado (evento onError),
  // para activar el fallback a las iniciales sin necesidad de reintentar la imagen.
  const [falla, setFalla] = useState(false);
  // Solo se intenta mostrar la imagen si hay URL y no ha fallado previamente.
  const mostrarImagen = Boolean(url) && !falla;

  return (
    <span
      className={cx(
        // Avatar circular con degradado azul → celeste, igual que fondo_avatar de la app.
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-atlantic-500 to-celeste-500 font-display font-bold text-white',
        className,
      )}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.4 }}
      // Si no hay nombre, el avatar es puramente decorativo (sin información para lectores
      // de pantalla); si hay nombre, la imagen interna ya lleva su propio "alt" descriptivo.
      aria-hidden={!nombre}
    >
      {mostrarImagen ? (
        <img
          src={url ?? undefined}
          alt={nombre ? `Foto de ${nombre}` : ''}
          className="h-full w-full object-cover"
          // Si la imagen no puede cargarse (URL rota, etc.), se activa el fallback a iniciales.
          onError={() => setFalla(true)}
        />
      ) : (
        iniciales(nombre)
      )}
    </span>
  );
}
