// Estilos compartidos por <Boton> (button) y <EnlaceBoton> (Link). Clonan el botón Material de la
// app Android (Widget.GaliciaWear.Boton): esquinas 16dp (rectángulo redondeado, NO píldora),
// alto 52dp, texto Syne bold 15sp con letter-spacing 0.01, padding 24dp y elevación 2dp.
import { cx } from '@/util/cx';

export type VarianteBoton = 'primario' | 'secundario' | 'galego' | 'fantasma' | 'peligro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-atlantic-500 text-white shadow-suave hover:bg-atlantic-600 active:bg-atlantic-700',
  secundario:
    'border border-atlantic-200 bg-white text-atlantic-700 hover:border-atlantic-400 hover:bg-atlantic-50',
  galego: 'bg-galego-500 text-white shadow-suave hover:bg-galego-600 active:bg-galego-700',
  fantasma: 'text-atlantic-700 hover:bg-atlantic-50',
  peligro: 'bg-peligro text-white shadow-suave hover:bg-peligro-fuerte',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-11 px-4 text-sm gap-1.5',
  md: 'h-12 px-6 text-[15px] gap-2',
  lg: 'h-[3.25rem] px-7 text-base gap-2.5',
};

/**
 * Devuelve las clases de Tailwind para un botón según variante, tamaño y si ocupa el ancho completo.
 * Compartida por <Boton> y <EnlaceBoton> para mantener un estilo idéntico entre ambos.
 */
export function clasesBoton(
  variante: VarianteBoton = 'primario',
  tamano: TamanoBoton = 'md',
  ancho = false,
): string {
  return cx(
    'inline-flex select-none items-center justify-center rounded-2xl font-display font-bold tracking-[0.01em]',
    'transition-[background,border,color,transform,box-shadow] duration-200 ease-suave',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55',
    VARIANTES[variante],
    TAMANOS[tamano],
    ancho && 'w-full',
  );
}
