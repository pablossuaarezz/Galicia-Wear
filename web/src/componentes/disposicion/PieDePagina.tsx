// Pie de página editorial: marca, navegación secundaria y nota de sostenibilidad.
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { ContenedorPagina } from './ContenedorPagina';
import { Marca } from './Marca';

const ENLACES_CATALOGO = [
  { a: '/catalogo', texto: 'Todo el catálogo' },
  { a: '/catalogo?certificado=GOTS', texto: 'Algodón GOTS' },
  { a: '/catalogo?material=LANA_RECICLADA', texto: 'Lana reciclada' },
  { a: '/disenadores', texto: 'Diseñadores' },
];

const ENLACES_CUENTA = [
  { a: '/cuenta/pedidos', texto: 'Mis pedidos' },
  { a: '/cuenta/direcciones', texto: 'Mis direcciones' },
  { a: '/cuenta/perfil', texto: 'Mi perfil' },
  { a: '/registro', texto: 'Crear cuenta' },
];

/** Pie de página global: marca, enlaces de catálogo y cuenta, y nota de sostenibilidad. */
export function PieDePagina() {
  return (
    <footer className="mt-20 border-t border-piedra-100 bg-white">
      <ContenedorPagina className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Marca alto={52} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-tinta-500">
              Moda sostenible diseñada en Galicia. Prendas de km0, materiales certificados y
              envíos ecológicos. Hecho con cariño desde a beiramar.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-galego-50 px-3 py-1 text-xs font-semibold text-galego-700">
              <Leaf className="h-3.5 w-3.5" aria-hidden />
              Compromiso km0
            </p>
          </div>

          <nav aria-label="Catálogo">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-tinta-400">
              Catálogo
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {ENLACES_CATALOGO.map((enlace) => (
                <li key={enlace.a}>
                  <Link to={enlace.a} className="text-tinta-600 transition-colors hover:text-atlantic-700">
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Tu cuenta">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-tinta-400">
              Tu cuenta
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {ENLACES_CUENTA.map((enlace) => (
                <li key={enlace.a}>
                  <Link to={enlace.a} className="text-tinta-600 transition-colors hover:text-atlantic-700">
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-piedra-100 pt-6 text-xs text-tinta-400 sm:flex-row">
          <p>© {new Date().getFullYear()} GaliciaWear · TFG DAM · Pablo Suárez</p>
          <p>Diseñado en A Coruña · Atlántico editorial sostenible</p>
        </div>
      </ContenedorPagina>
    </footer>
  );
}
