// Barra de navegación principal: marca, navegación, buscador, carrito con badge, campana de
// notificaciones y menú de usuario. En móvil se colapsa en un cajón lateral.
//
// Este componente se monta una sola vez dentro de `DisposicionPrincipal` y permanece fijo
// (sticky) en la parte superior de todas las páginas del storefront (catálogo, diseñadores,
// cuenta, etc.). Combina varios subcomponentes de esta misma carpeta: `Marca`, `BuscadorNav`,
// `CampanaNotificaciones` y `MenuUsuario`.
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

// Enlaces principales de navegación, comunes a escritorio (barra horizontal) y móvil (cajón).
const ENLACES = [
  { a: '/catalogo', texto: 'Catálogo' },
  { a: '/disenadores', texto: 'Diseñadores' },
];

/**
 * Calcula las clases Tailwind de un enlace de navegación según si su ruta está activa.
 * Se usa como función `className` de `NavLink` (React Router pasa `{ isActive }`).
 *
 * @param isActive - Indica si la ruta del enlace coincide con la ubicación actual.
 * @returns Cadena de clases Tailwind con estilo "activo" o "inactivo".
 */
function claseEnlace({ isActive }: { isActive: boolean }): string {
  return cx(
    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-atlantic-50 text-atlantic-700' : 'text-tinta-600 hover:text-atlantic-700',
  );
}

/**
 * Icono del carrito de la compra con una insignia (badge) animada que muestra el número total
 * de unidades. Solo se renderiza para clientes (los diseñadores no compran, ver uso más abajo).
 */
function IconoCarrito() {
  // `resumen` proviene del contexto global del carrito; se actualiza cada vez que se
  // añaden/eliminan artículos desde cualquier parte de la aplicación.
  const { resumen } = usarCarrito();
  const unidades = resumen.totalUnidades;
  return (
    <Link
      to="/carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-tinta-600 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
      aria-label={`Carrito${unidades ? `, ${unidades} artículos` : ''}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {/* Insignia con el número de unidades; animación con muelle (spring) al cambiar de valor
          y desaparición suave cuando el carrito queda vacío. */}
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

/**
 * Barra de navegación superior del storefront (cabecera "sticky").
 *
 * Renderiza, en escritorio, la marca, los enlaces principales, el buscador, el carrito,
 * la campana de notificaciones y el menú de usuario (o los botones de entrar/registrarse si
 * no hay sesión). En pantallas pequeñas, los enlaces y el buscador se mueven a un cajón (`Cajon`)
 * que se abre con el botón de hamburguesa.
 *
 * No recibe props: obtiene el estado de sesión del contexto `ContextoSesion`.
 */
export function BarraNavegacion() {
  // Controla la visibilidad del cajón de navegación móvil.
  const [menuMovil, setMenuMovil] = useState(false);
  // `estaAutenticado` decide qué bloque de acciones se muestra (menú de usuario vs. botones de
  // login/registro); `esDisenador` añade el enlace "Mi panel" y oculta el carrito para
  // diseñadores (no compran en su propia tienda).
  const { estaAutenticado, esDisenador } = usarSesion();

  return (
    <header className="sticky top-0 z-40 border-b border-piedra-100 bg-sand-50/85 backdrop-blur-md">
      <ContenedorPagina className="flex h-16 items-center gap-3">
        <Marca alto={36} className="shrink-0" />

        {/* Navegación principal: solo visible en pantallas grandes (lg). En móvil estos enlaces
            se repiten dentro del cajón. */}
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

        {/* Buscador centrado, visible a partir de md (oculto en móvil; allí se muestra dentro
            del cajón). */}
        <div className="mx-auto hidden w-full max-w-sm md:block">
          <BuscadorNav />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* El carrito no aplica a diseñadores (venden, no compran). */}
          {!esDisenador && <IconoCarrito />}
          {/* La campana de notificaciones solo tiene sentido con sesión iniciada. */}
          {estaAutenticado && <CampanaNotificaciones />}

          {estaAutenticado ? (
            <MenuUsuario />
          ) : (
            // Sin sesión: botones de acceso, ocultos en pantallas muy pequeñas (sm en adelante).
            <div className="hidden items-center gap-2 sm:flex">
              <EnlaceBoton to="/login" variante="fantasma" tamano="sm">
                Entrar
              </EnlaceBoton>
              <EnlaceBoton to="/registro" variante="primario" tamano="sm">
                Crear cuenta
              </EnlaceBoton>
            </div>
          )}

          {/* Botón de hamburguesa: abre el cajón de navegación móvil. Solo visible por debajo
              de lg, donde la <nav> principal está oculta. */}
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

      {/* Cajón lateral con el contenido de navegación para móvil: buscador, enlaces principales
          y, si no hay sesión, los botones de entrar/crear cuenta. */}
      <Cajon abierto={menuMovil} alCerrar={() => setMenuMovil(false)} titulo="Menú">
        <div className="space-y-6">
          {/* Al enviar la búsqueda desde el cajón, se cierra automáticamente. */}
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

          {/* Accesos de autenticación, solo si el usuario no ha iniciado sesión. */}
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
