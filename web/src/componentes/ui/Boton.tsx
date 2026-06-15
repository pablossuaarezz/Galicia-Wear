// Botón del sistema de diseño con estados press/hover/disabled/cargando consistentes, y su
// gemelo <EnlaceBoton> para navegación (react-router Link con el mismo aspecto).
//
// Estos componentes encapsulan las variantes visuales definidas en estilosBoton.ts (color,
// tamaño, ancho completo) y añaden comportamiento común: indicador de carga con spinner,
// iconos opcionales a ambos lados del texto y accesibilidad (aria-busy) durante la carga.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from '@/util/cx';
import { Spinner } from './Spinner';
import { clasesBoton, type TamanoBoton, type VarianteBoton } from './estilosBoton';

/**
 * Props compartidas entre {@link Boton} y {@link EnlaceBoton}: controlan la apariencia
 * (variante de color, tamaño, ancho completo) y los iconos decorativos opcionales.
 */
interface PropsComunes {
  /** Variante de color/estilo del botón (primario, secundario, galego, fantasma, peligro). */
  variante?: VarianteBoton;
  /** Tamaño del botón (sm, md, lg), determina alto, padding y tipografía. */
  tamano?: TamanoBoton;
  /** Si es true, el botón ocupa el 100% del ancho del contenedor. */
  ancho?: boolean;
  /** Icono opcional mostrado antes del contenido (se oculta mientras `cargando` es true). */
  iconoIzquierda?: ReactNode;
  /** Icono opcional mostrado después del contenido (se oculta mientras `cargando` es true). */
  iconoDerecha?: ReactNode;
}

/**
 * Props del componente {@link Boton}: combina las props comunes de apariencia, el estado
 * `cargando` y todos los atributos HTML nativos de un <button>.
 */
type PropsBoton = PropsComunes & {
  /** Si es true, muestra un spinner en lugar del icono izquierdo y deshabilita el botón. */
  cargando?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Botón principal del sistema de diseño.
 *
 * Aplica las clases de estilo según `variante`, `tamano` y `ancho` (ver estilosBoton.ts),
 * y gestiona el estado de carga: mientras `cargando` es true se deshabilita el botón,
 * se marca `aria-busy` para lectores de pantalla y se sustituye el icono izquierdo por
 * un {@link Spinner}.
 *
 * Usa `forwardRef` para permitir que componentes padre obtengan una referencia directa
 * al elemento <button> (por ejemplo, para gestionar el foco).
 */
export const Boton = forwardRef<HTMLButtonElement, PropsBoton>(function Boton(
  {
    variante,
    tamano,
    ancho,
    cargando = false,
    iconoIzquierda,
    iconoDerecha,
    disabled,
    className,
    children,
    type = 'button',
    ...resto
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // El botón se deshabilita tanto si lo indica el padre como si está en estado de carga.
      disabled={disabled || cargando}
      // aria-busy informa a lectores de pantalla de que la acción está en proceso.
      aria-busy={cargando || undefined}
      className={cx(clasesBoton(variante, tamano, ancho), className)}
      {...resto}
    >
      {/* Mientras se carga, el spinner sustituye al icono izquierdo */}
      {cargando ? <Spinner /> : iconoIzquierda}
      {children}
      {/* El icono derecho se oculta durante la carga para evitar redundancia visual */}
      {!cargando && iconoDerecha}
    </button>
  );
});

/** Props del componente {@link EnlaceBoton}: combina las props comunes de apariencia con las de react-router `Link`. */
type PropsEnlaceBoton = PropsComunes & LinkProps;

/**
 * Variante de {@link Boton} para navegación interna, basada en `react-router-dom`'s `Link`.
 *
 * Comparte exactamente las mismas clases de estilo que {@link Boton} (mediante `clasesBoton`)
 * para mantener una apariencia idéntica, pero renderiza un enlace de navegación en lugar de
 * un elemento <button>. No soporta estado de carga, ya que la navegación es instantánea.
 */
export function EnlaceBoton({
  variante,
  tamano,
  ancho,
  iconoIzquierda,
  iconoDerecha,
  className,
  children,
  ...resto
}: PropsEnlaceBoton) {
  return (
    <Link className={cx(clasesBoton(variante, tamano, ancho), className)} {...resto}>
      {iconoIzquierda}
      {children}
      {iconoDerecha}
    </Link>
  );
}
