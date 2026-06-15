// Tarjeta de diseñador (marca): logo/iniciales, ciudad y biografía resumida. Enlaza a su perfil.
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Avatar } from '@/componentes/ui';
import { CIUDADES } from '@/util/constantes';
import type { DisenadorPublico } from '@/api/tipos';

/**
 * Tarjeta resumen de un diseñador (marca) para listados de catálogo o búsqueda.
 *
 * Muestra el avatar/logo de la marca, su nombre, ciudad de origen y una biografía recortada
 * a 3 líneas. La tarjeta completa es un enlace al perfil público del diseñador.
 *
 * @param disenador - Datos públicos del diseñador a mostrar.
 * @returns Tarjeta enlazada a `/disenador/:usuarioId`.
 */
export function TarjetaDisenador({ disenador }: { disenador: DisenadorPublico }) {
  return (
    <Link
      to={`/disenador/${disenador.usuarioId}`}
      className="group flex flex-col rounded-xl2 border border-piedra-100 bg-white p-5 shadow-suave transition-all duration-300 ease-suave hover:-translate-y-1 hover:shadow-flotante"
    >
      <div className="flex items-center gap-3">
        <Avatar nombre={disenador.nombreMarca} url={disenador.urlLogo} tamano={52} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-tinta-900 group-hover:text-atlantic-700">
            {disenador.nombreMarca}
          </h3>
          <p className="inline-flex items-center gap-1 text-xs text-tinta-400">
            <MapPin className="h-3 w-3" aria-hidden />
            {CIUDADES[disenador.ciudad]}
          </p>
        </div>
        <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-tinta-300 transition-colors group-hover:text-atlantic-500" aria-hidden />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-tinta-500">{disenador.biografia}</p>
    </Link>
  );
}
