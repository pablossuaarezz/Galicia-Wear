// Sub-disposición de la zona de cuenta del cliente: encabezado + navegación lateral + contenido.
import { Outlet } from 'react-router-dom';
import { MapPin, MessagesSquare, Package, User } from 'lucide-react';
import { ContenedorPagina } from './ContenedorPagina';
import { EncabezadoPagina } from './EncabezadoPagina';
import { NavLateral, type EnlaceLateral } from './NavLateral';

const ENLACES: EnlaceLateral[] = [
  { a: '/cuenta/perfil', texto: 'Mi perfil', Icono: User },
  { a: '/cuenta/direcciones', texto: 'Mis direcciones', Icono: MapPin },
  { a: '/cuenta/pedidos', texto: 'Mis pedidos', Icono: Package },
  { a: '/mensajes', texto: 'Mensajes', Icono: MessagesSquare },
];

export function DisposicionCuenta() {
  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Tu cuenta" titulo="Mi cuenta" />
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
