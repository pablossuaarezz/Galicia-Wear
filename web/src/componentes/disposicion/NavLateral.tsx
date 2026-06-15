// Navegación lateral reutilizable para las zonas de cuenta y panel del diseñador. En escritorio
// es una columna fija; en móvil, una fila de pestañas con scroll horizontal.
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/util/cx';

export interface EnlaceLateral {
  a: string;
  texto: string;
  Icono: LucideIcon;
  /** Coincidencia exacta (para índices) para no marcar activo en sub-rutas. */
  exacto?: boolean;
}

/** Navegación de sección (columna en escritorio, pestañas con scroll en móvil) que resalta la ruta activa. */
export function NavLateral({ enlaces }: { enlaces: EnlaceLateral[] }) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0"
      aria-label="Navegación de sección"
    >
      {enlaces.map(({ a, texto, Icono, exacto }) => (
        <NavLink
          key={a}
          to={a}
          end={exacto}
          className={({ isActive }) =>
            cx(
              'inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-atlantic-500 text-white shadow-suave'
                : 'text-tinta-600 hover:bg-white hover:text-atlantic-700',
            )
          }
        >
          <Icono className="h-4 w-4" aria-hidden />
          {texto}
        </NavLink>
      ))}
    </nav>
  );
}
