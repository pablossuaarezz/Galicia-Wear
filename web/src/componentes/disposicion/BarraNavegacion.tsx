// Barra de navegación principal: marca, navegación, buscador, carrito con badge, campana de
// notificaciones y menú de usuario. En móvil se colapsa en un cajón lateral.
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag } from 'lucide-react';
import { cx } from '@/util/cx';
import { Cajon, EnlaceBoton } from '@/componentes/ui';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarCarrito } from '@/contexto/ContextoCarrito';
import { ContenedorPagina } from './ContenedorPagina';
import { Marca } from './Marca';
import { BuscadorNav } from './BuscadorNav';
import { CampanaNotificaciones } from './CampanaNotificaciones';
import { MenuUsuario } from './MenuUsuario';

const ENLACES = [
  { a: '/catalogo', texto: 'Catálogo' },
  { a: '/disenadores', texto: 'Diseñadores' },
];

function claseEnlace({ isActive }: { isActive: boolean }): string {
  return cx(
    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-atlantic-50 text-atlantic-700' : 'text-tinta-600 hover:text-atlantic-700',
  );
}

function IconoCarrito() {
  const { resumen } = usarCarrito();
  const unidades = resumen.totalUnidades;
  return (
    <Link
      to="/carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-tinta-600 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
      aria-label={`Carrito${unidades ? `, ${unidades} artículos` : ''}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      <AnimatePresence>
        {unidades > 0 && (
          <motion.span
            key={unidades}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-galego-500 px-1 text-[10px] font-bold text-white"
          >
            {unidades > 99 ? '99+' : unidades}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

export function BarraNavegacion() {
  const [menuMovil, setMenuMovil] = useState(false);
  const { estaAutenticado, esDisenador } = usarSesion();

  return (
    <header className="sticky top-0 z-40 border-b border-piedra-100 bg-sand-50/85 backdrop-blur-md">
      <ContenedorPagina className="flex h-16 items-center gap-3">
        <Marca className="shrink-0" />

        <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Principal">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.a} to={enlace.a} className={claseEnlace}>
              {enlace.texto}
            </NavLink>
          ))}
          {esDisenador && (
            <NavLink to="/panel" className={claseEnlace}>
              Mi panel
            </NavLink>
          )}
        </nav>

        <div className="mx-auto hidden w-full max-w-sm md:block">
          <BuscadorNav />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {!esDisenador && <IconoCarrito />}
          {estaAutenticado && <CampanaNotificaciones />}

          {estaAutenticado ? (
            <MenuUsuario />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <EnlaceBoton to="/login" variante="fantasma" tamano="sm">
                Entrar
              </EnlaceBoton>
              <EnlaceBoton to="/registro" variante="primario" tamano="sm">
                Crear cuenta
              </EnlaceBoton>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuMovil(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-tinta-600 transition-colors hover:bg-atlantic-50 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </ContenedorPagina>

      <Cajon abierto={menuMovil} alCerrar={() => setMenuMovil(false)} titulo="Menú">
        <div className="space-y-6">
          <BuscadorNav alEnviar={() => setMenuMovil(false)} />

          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                onClick={() => setMenuMovil(false)}
                className={({ isActive }) =>
                  cx(
                    'rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-atlantic-50 text-atlantic-700'
                      : 'text-tinta-700 hover:bg-sand-100',
                  )
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
            {esDisenador && (
              <NavLink
                to="/panel"
                onClick={() => setMenuMovil(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-tinta-700 hover:bg-sand-100"
              >
                Mi panel
              </NavLink>
            )}
          </nav>

          {!estaAutenticado && (
            <div className="flex flex-col gap-2 border-t border-piedra-100 pt-5">
              <EnlaceBoton to="/login" variante="secundario" ancho onClick={() => setMenuMovil(false)}>
                Entrar
              </EnlaceBoton>
              <EnlaceBoton to="/registro" variante="primario" ancho onClick={() => setMenuMovil(false)}>
                Crear cuenta
              </EnlaceBoton>
            </div>
          )}
        </div>
      </Cajon>
    </header>
  );
}
