// Panel de filtros del catálogo (totalmente controlado por la página). Sirve como columna
// lateral en escritorio y como contenido del cajón de filtros en móvil. La búsqueda escribe en
// el estado al instante; la página aplica el debounce sobre la consulta a la API.
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Campo, Selector } from '@/componentes/ui';
import { CIUDADES, CODIGOS_CIUDAD, CODIGOS_MATERIAL, MATERIALES } from '@/util/constantes';
import type { CodigoCertificado, FiltrosCatalogo } from '@/api/tipos';
import { ChipsCertificados } from './ChipsCertificados';

const KM_MAXIMO = 500;

interface PropsBarraFiltros {
  valores: FiltrosCatalogo;
  alActualizar: (parcial: Partial<FiltrosCatalogo>) => void;
  alLimpiar: () => void;
}

export function BarraFiltros({ valores, alActualizar, alLimpiar }: PropsBarraFiltros) {
  const hayFiltros = Boolean(
    valores.busqueda || valores.material || valores.ciudad || valores.certificado || valores.maxKm,
  );
  const km = valores.maxKm ?? KM_MAXIMO;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-tinta-800">
          <SlidersHorizontal className="h-4 w-4 text-atlantic-500" aria-hidden />
          Filtros
        </h2>
        {hayFiltros && (
          <button
            type="button"
            onClick={alLimpiar}
            className="inline-flex items-center gap-1 text-xs font-medium text-tinta-500 hover:text-peligro-fuerte"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Limpiar
          </button>
        )}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-tinta-400"
          aria-hidden
        />
        <Campo
          etiqueta="Buscar"
          type="search"
          placeholder="Prenda, material…"
          value={valores.busqueda ?? ''}
          onChange={(e) => alActualizar({ busqueda: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      <Selector
        etiqueta="Material"
        value={valores.material ?? ''}
        onChange={(e) => alActualizar({ material: (e.target.value || undefined) as FiltrosCatalogo['material'] })}
      >
        <option value="">Todos los materiales</option>
        {CODIGOS_MATERIAL.map((codigo) => (
          <option key={codigo} value={codigo}>
            {MATERIALES[codigo]}
          </option>
        ))}
      </Selector>

      <Selector
        etiqueta="Ciudad gallega"
        value={valores.ciudad ?? ''}
        onChange={(e) => alActualizar({ ciudad: (e.target.value || undefined) as FiltrosCatalogo['ciudad'] })}
      >
        <option value="">Toda Galicia</option>
        {CODIGOS_CIUDAD.map((codigo) => (
          <option key={codigo} value={codigo}>
            {CIUDADES[codigo]}
          </option>
        ))}
      </Selector>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="filtro-km" className="text-sm font-medium text-tinta-700">
            Distancia de origen
          </label>
          <span className="text-xs font-semibold text-atlantic-700">
            {km >= KM_MAXIMO ? 'Sin límite' : `Hasta ${km} km`}
          </span>
        </div>
        <input
          id="filtro-km"
          type="range"
          min={0}
          max={KM_MAXIMO}
          step={25}
          value={km}
          onChange={(e) => {
            const valor = Number(e.target.value);
            alActualizar({ maxKm: valor >= KM_MAXIMO ? undefined : valor });
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-piedra-200 accent-atlantic-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-tinta-700">Certificados</p>
        <ChipsCertificados
          seleccionado={valores.certificado}
          alSeleccionar={(codigo: CodigoCertificado | undefined) => alActualizar({ certificado: codigo })}
        />
      </div>
    </div>
  );
}
