// Contenedor central con anchos máximos y padding lateral responsive.
//
// Componente de disposición de bajo nivel que centra horizontalmente su contenido (`mx-auto`),
// limita el ancho máximo según la variante elegida y aplica un padding lateral que crece con el
// tamaño de pantalla. Lo reutilizan prácticamente todas las disposiciones y páginas del
// storefront (BarraNavegacion, PieDePagina, DisposicionCuenta, DisposicionPanel, etc.) para
// mantener una rejilla y unos márgenes coherentes en toda la aplicación.
import type { HTMLAttributes } from 'react';
import { cx } from '@/util/cx';

/**
 * Props del contenedor. Extiende los atributos HTML estándar de un `<div>`, de modo que se
 * pueden pasar `id`, `role`, manejadores de eventos, etc., que se reenvían al elemento raíz.
 */
interface PropsContenedor extends HTMLAttributes<HTMLDivElement> {
  /** Ancho máximo del contenedor; controla la variante de la tabla `ANCHOS`. */
  ancho?: 'estrecho' | 'normal' | 'ancho';
}

// Mapa de variante de ancho a la clase Tailwind correspondiente de `max-width`.
const ANCHOS = {
  estrecho: 'max-w-3xl',
  normal: 'max-w-6xl',
  ancho: 'max-w-7xl',
};

/**
 * Envoltorio centrado con ancho máximo y padding lateral responsive.
 *
 * @param ancho - Variante de ancho máximo (por defecto `'normal'`).
 * @param className - Clases Tailwind adicionales que se combinan con las base.
 * @param children - Contenido a centrar dentro del contenedor.
 * @param resto - Resto de atributos HTML del `<div>`, reenviados al elemento raíz.
 */
export function ContenedorPagina({ ancho = 'normal', className, children, ...resto }: PropsContenedor) {
  return (
    // `mx-auto w-full` centra y ocupa todo el ancho disponible; el padding lateral aumenta en
    // los breakpoints sm/lg; `ANCHOS[ancho]` fija el límite máximo según la variante.
    <div className={cx('mx-auto w-full px-4 sm:px-6 lg:px-8', ANCHOS[ancho], className)} {...resto}>
      {children}
    </div>
  );
}
