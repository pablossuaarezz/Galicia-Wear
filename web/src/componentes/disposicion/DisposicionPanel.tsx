// Sub-disposición del dashboard del diseñador: encabezado + navegación lateral + contenido.
//
// Disposición anidada (montada dentro de `DisposicionPrincipal`) que envuelve todas las rutas
// del panel de gestión del diseñador bajo `/panel/*` (resumen, prendas, pedidos recibidos,
// perfil de marca) y `/mensajes`. Es la versión para vendedores del esquema "encabezado +
// navegación lateral + Outlet", análoga a `DisposicionCuenta` pero con sus propios enlaces.
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MessagesSquare, Package, ShoppingBag, Store } from 'lucide-react';
import { ContenedorPagina } from './ContenedorPagina';
import { EncabezadoPagina } from './EncabezadoPagina';
import { NavLateral, type EnlaceLateral } from './NavLateral';

// Enlaces de la navegación lateral del panel del diseñador. "Resumen" usa `exacto: true` para
// que solo se marque activo en `/panel` y no en sus sub-rutas (p. ej. `/panel/prendas`).
const ENLACES: EnlaceLateral[] = [
  { a: '/panel', texto: 'Resumen', Icono: LayoutDashboard, exacto: true },
  { a: '/panel/prendas', texto: 'Mis prendas', Icono: Package },
  { a: '/panel/pedidos', texto: 'Pedidos recibidos', Icono: ShoppingBag },
  { a: '/panel/marca', texto: 'Perfil de marca', Icono: Store },
  { a: '/mensajes', texto: 'Mensajes', Icono: MessagesSquare },
];

/**
 * Disposición del panel de gestión del diseñador.
 *
 * No recibe props. Renderiza el encabezado de sección, la navegación lateral (`NavLateral`) con
 * los enlaces del panel y un `<Outlet />` donde React Router monta la sub-página activa.
 */
export function DisposicionPanel() {
  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Diseñador" titulo="Panel" />
      {/* Rejilla de dos columnas en escritorio (lateral fijo de 220px + contenido flexible);
          en móvil colapsa a una sola columna apilada. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* La navegación lateral queda fija (sticky) al hacer scroll solo en escritorio. */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <NavLateral enlaces={ENLACES} />
        </aside>
        {/* `min-w-0` evita que el contenido ancho (tablas, etc.) desborde la columna. */}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </ContenedorPagina>
  );
}
