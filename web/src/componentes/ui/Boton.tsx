// Botón del sistema de diseño con estados press/hover/disabled/cargando consistentes, y su
// gemelo <EnlaceBoton> para navegación (react-router Link con el mismo aspecto).
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from '@/util/cx';
import { Spinner } from './Spinner';
import { clasesBoton, type TamanoBoton, type VarianteBoton } from './estilosBoton';

interface PropsComunes {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  ancho?: boolean;
  iconoIzquierda?: ReactNode;
  iconoDerecha?: ReactNode;
}

type PropsBoton = PropsComunes & {
  cargando?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

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
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={cx(clasesBoton(variante, tamano, ancho), className)}
      {...resto}
    >
      {cargando ? <Spinner /> : iconoIzquierda}
      {children}
      {!cargando && iconoDerecha}
    </button>
  );
});

type PropsEnlaceBoton = PropsComunes & LinkProps;

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
