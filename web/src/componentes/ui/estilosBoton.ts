// Estilos compartidos por <Boton> (button) y <EnlaceBoton> (Link), para no duplicar clases.
import { cx } from '@/util/cx';

export type VarianteBoton = 'primario' | 'secundario' | 'galego' | 'fantasma' | 'peligro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-atlantic-500 text-white shadow-suave hover:bg-atlantic-600 active:bg-atlantic-700',
  secundario:
    'border border-piedra-200 bg-white text-tinta-800 hover:border-atlantic-300 hover:bg-atlantic-50',
  galego: 'bg-galego-500 text-white shadow-suave hover:bg-galego-600 active:bg-galego-700',
  fantasma: 'text-atlantic-700 hover:bg-atlantic-50',
  peligro: 'bg-peligro text-white shadow-suave hover:bg-peligro-fuerte',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

export function clasesBoton(
  variante: VarianteBoton = 'primario',
  tamano: TamanoBoton = 'md',
  ancho = false,
): string {
  return cx(
    'inline-flex select-none items-center justify-center rounded-full font-display font-semibold',
    'transition-[background,border,color,transform,box-shadow] duration-200 ease-suave',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55',
    VARIANTES[variante],
    TAMANOS[tamano],
    ancho && 'w-full',
  );
}
