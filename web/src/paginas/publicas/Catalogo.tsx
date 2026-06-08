// Catálogo público. Los filtros viven en la URL (compartible y con atrás/adelante coherentes);
// la consulta a la API se hace con debounce para no pedir en cada pulsación. Columna de filtros
// en escritorio y cajón en móvil.
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { Boton, Cajon, Paginador } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { EncabezadoPagina } from '@/componentes/disposicion/EncabezadoPagina';
import { BarraFiltros } from '@/componentes/catalogo/BarraFiltros';
import { RejillaProductos } from '@/componentes/catalogo/RejillaProductos';
import { usarCatalogo } from '@/hooks/usarCatalogo';
import { usarDebounce } from '@/hooks/usarDebounce';
import { usarTitulo } from '@/hooks/usarTitulo';
import type {
  CiudadGallega,
  CodigoCertificado,
  FiltrosCatalogo,
  MaterialPrincipal,
} from '@/api/tipos';

function leerFiltros(parametros: URLSearchParams): FiltrosCatalogo {
  return {
    busqueda: parametros.get('busqueda') || undefined,
    material: (parametros.get('material') as MaterialPrincipal) || undefined,
    ciudad: (parametros.get('ciudad') as CiudadGallega) || undefined,
    maxKm: parametros.get('maxKm') ? Number(parametros.get('maxKm')) : undefined,
    certificado: (parametros.get('certificado') as CodigoCertificado) || undefined,
    pagina: parametros.get('pagina') ? Number(parametros.get('pagina')) : 1,
  };
}

function contarActivos(filtros: FiltrosCatalogo): number {
  return [filtros.busqueda, filtros.material, filtros.ciudad, filtros.certificado, filtros.maxKm].filter(
    (v) => v !== undefined && v !== '',
  ).length;
}

export default function Catalogo() {
  usarTitulo('Catálogo');
  const [parametros, setParametros] = useSearchParams();
  const [cajonAbierto, setCajonAbierto] = useState(false);

  // Identidad estable de los filtros mientras la URL no cambie (evita reiniciar el debounce).
  const clave = parametros.toString();
  const filtros = useMemo(() => leerFiltros(parametros), [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtrosConsulta = usarDebounce(filtros, 300);

  const consulta = usarCatalogo({ ...filtrosConsulta, limite: 12 });
  const total = consulta.data?.total ?? 0;

  function actualizar(parcial: Partial<FiltrosCatalogo>) {
    const siguiente = new URLSearchParams(parametros);
    for (const [campo, valor] of Object.entries(parcial)) {
      if (valor === undefined || valor === '' || valor === null) siguiente.delete(campo);
      else siguiente.set(campo, String(valor));
    }
    // Cualquier cambio de filtro vuelve a la página 1.
    if (!('pagina' in parcial)) siguiente.delete('pagina');
    setParametros(siguiente, { replace: true });
  }

  function limpiar() {
    setParametros({}, { replace: true });
  }

  function cambiarPagina(pagina: number) {
    actualizar({ pagina });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activos = contarActivos(filtros);

  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina
        antetitulo="Marketplace"
        titulo="El catálogo"
        descripcion="Prendas de diseñadores gallegos, hechas con materiales certificados y mirada de km0."
      />

      <div className="mt-8 flex items-center justify-between lg:hidden">
        <p className="text-sm text-tinta-500">
          {consulta.isLoading ? 'Cargando…' : `${total} ${total === 1 ? 'prenda' : 'prendas'}`}
        </p>
        <Boton
          variante="secundario"
          tamano="sm"
          iconoIzquierda={<SlidersHorizontal className="h-4 w-4" />}
          onClick={() => setCajonAbierto(true)}
        >
          Filtros{activos > 0 ? ` (${activos})` : ''}
        </Boton>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl2 border border-piedra-100 bg-white p-5 shadow-suave">
            <BarraFiltros valores={filtros} alActualizar={actualizar} alLimpiar={limpiar} />
          </div>
        </aside>

        <div>
          <p className="mb-5 hidden text-sm text-tinta-500 lg:block">
            {consulta.isLoading ? 'Cargando…' : `${total} ${total === 1 ? 'prenda encontrada' : 'prendas encontradas'}`}
          </p>

          {consulta.isError ? (
            <RejillaProductos
              productos={[]}
              tituloVacio="No se pudo cargar el catálogo"
              descripcionVacio="Revisa tu conexión o inténtalo de nuevo en unos segundos."
            />
          ) : (
            <RejillaProductos
              productos={consulta.data?.datos ?? []}
              cargando={consulta.isLoading}
              cantidadEsqueletos={12}
            />
          )}

          <div className="mt-10">
            <Paginador
              pagina={filtros.pagina ?? 1}
              total={total}
              limite={12}
              alCambiar={cambiarPagina}
            />
          </div>
        </div>
      </div>

      <Cajon
        abierto={cajonAbierto}
        alCerrar={() => setCajonAbierto(false)}
        titulo="Filtros"
        pie={
          <Boton ancho onClick={() => setCajonAbierto(false)}>
            Ver {total} {total === 1 ? 'resultado' : 'resultados'}
          </Boton>
        }
      >
        <BarraFiltros valores={filtros} alActualizar={actualizar} alLimpiar={limpiar} />
      </Cajon>
    </ContenedorPagina>
  );
}
