// Sub-disposición de la zona de cuenta del cliente: encabezado + navegación lateral + contenido.
//
// Disposición anidada (se monta dentro de `DisposicionPrincipal`) que envuelve todas las rutas
// bajo `/cuenta/*` (perfil, direcciones, pedidos) y `/mensajes`. Proporciona un encabezado
// editorial común y una barra de navegación lateral; el contenido concreto de cada sub-ruta se
// inyecta a través del `<Outlet />` de React Router.
import { Outlet } from 'react-router-dom';
import { MapPin, MessagesSquare, Package, User } from 'lucide-react';
import { ContenedorPagina } from './ContenedorPagina';
import { EncabezadoPagina } from './EncabezadoPagina';
import { NavLateral, type EnlaceLateral } from './NavLateral';

// Enlaces de la navegación lateral de la zona de cuenta del cliente; cada uno asocia una ruta,
// su etiqueta visible y el icono de Lucide que lo representa.
const ENLACES: EnlaceLateral[] = [
  { a: '/cuenta/perfil', texto: 'Mi perfil', Icono: User },
  { a: '/cuenta/direcciones', texto: 'Mis direcciones', Icono: MapPin },
  { a: '/cuenta/pedidos', texto: 'Mis pedidos', Icono: Package },
  { a: '/mensajes', texto: 'Mensajes', Icono: MessagesSquare },
];

/**
 * Disposición de la sección "Mi cuenta" del cliente.
 *
 * No recibe props. Renderiza el encabezado de sección, la navegación lateral (`NavLateral`) y
 * un `<Outlet />` donde React Router monta la sub-página activa.
 */
export function DisposicionCuenta() {
  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Tu cuenta" titulo="Mi cuenta" />
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
