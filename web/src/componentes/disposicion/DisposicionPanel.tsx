// Sub-disposición del dashboard del diseñador: encabezado + navegación lateral + contenido.
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MessagesSquare, Package, ShoppingBag, Store } from 'lucide-react';
import { ContenedorPagina } from './ContenedorPagina';
import { EncabezadoPagina } from './EncabezadoPagina';
import { NavLateral, type EnlaceLateral } from './NavLateral';

const ENLACES: EnlaceLateral[] = [
  { a: '/panel', texto: 'Resumen', Icono: LayoutDashboard, exacto: true },
  { a: '/panel/prendas', texto: 'Mis prendas', Icono: Package },
  { a: '/panel/pedidos', texto: 'Pedidos recibidos', Icono: ShoppingBag },
  { a: '/panel/marca', texto: 'Perfil de marca', Icono: Store },
  { a: '/mensajes', texto: 'Mensajes', Icono: MessagesSquare },
];

export function DisposicionPanel() {
  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Diseñador" titulo="Panel" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <NavLateral enlaces={ENLACES} />
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </ContenedorPagina>
  );
}
