// Menú de usuario autenticado: avatar + desplegable con accesos de cuenta y cierre de sesión.
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, MapPin, Package, User } from 'lucide-react';
import { Avatar } from '@/componentes/ui';
import { usarClicFuera } from '@/hooks/usarClicFuera';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarBrindis } from '@/componentes/ui/Brindis';

const ENLACES_CLIENTE = [
  { a: '/cuenta/perfil', texto: 'Mi perfil', Icono: User },
  { a: '/cuenta/pedidos', texto: 'Mis pedidos', Icono: Package },
  { a: '/cuenta/direcciones', texto: 'Mis direcciones', Icono: MapPin },
];

export function MenuUsuario() {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const { usuario, esDisenador, cerrarSesion } = usarSesion();
  const brindis = usarBrindis();
  const navegar = useNavigate();

  usarClicFuera(contenedor, () => setAbierto(false), abierto);

  async function salir() {
    setAbierto(false);
    await cerrarSesion();
    brindis.info('Has cerrado sesión');
    navegar('/');
  }

  const nombre = usuario?.nombre ?? usuario?.correo ?? 'Mi cuenta';

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 transition-shadow hover:shadow-suave focus-visible:outline-none"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
      >
        <Avatar nombre={nombre} url={usuario?.avatarUrl} tamano={36} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl2 border border-piedra-100 bg-white py-1.5 shadow-flotante"
            role="menu"
          >
            <div className="border-b border-piedra-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-tinta-800">{nombre}</p>
              <p className="truncate text-xs text-tinta-400">{usuario?.correo}</p>
            </div>

            {esDisenador ? (
              <Link
                to="/panel"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-tinta-700 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Panel de diseñador
              </Link>
            ) : (
              ENLACES_CLIENTE.map(({ a, texto, Icono }) => (
                <Link
                  key={a}
                  to={a}
                  role="menuitem"
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-tinta-700 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
                >
                  <Icono className="h-4 w-4" aria-hidden />
                  {texto}
                </Link>
              ))
            )}

            <div className="my-1 border-t border-piedra-100" />
            <button
              type="button"
              role="menuitem"
              onClick={salir}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-peligro-fuerte transition-colors hover:bg-peligro-suave"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
