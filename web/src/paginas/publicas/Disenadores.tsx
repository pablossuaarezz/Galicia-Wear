// Listado público de diseñadores validados, con filtro por ciudad gallega y paginación.
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Chip, EstadoVacio, Esqueleto, Paginador } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { EncabezadoPagina } from '@/componentes/disposicion/EncabezadoPagina';
import { TarjetaDisenador } from '@/componentes/catalogo/TarjetaDisenador';
import { usarDisenadores } from '@/hooks/usarCatalogo';
import { usarTitulo } from '@/hooks/usarTitulo';
import { CIUDADES, CODIGOS_CIUDAD } from '@/util/constantes';
import type { CiudadGallega } from '@/api/tipos';

const LIMITE = 12;

export default function Disenadores() {
  usarTitulo('Diseñadores');
  const [parametros, setParametros] = useSearchParams();
  const ciudad = (parametros.get('ciudad') as CiudadGallega) || undefined;
  const pagina = parametros.get('pagina') ? Number(parametros.get('pagina')) : 1;

  const filtros = useMemo(() => ({ ciudad, pagina, limite: LIMITE }), [ciudad, pagina]);
  const consulta = usarDisenadores(filtros);
  const total = consulta.data?.total ?? 0;

  function elegirCiudad(nueva: CiudadGallega | undefined) {
    const siguiente = new URLSearchParams(parametros);
    if (nueva) siguiente.set('ciudad', nueva);
    else siguiente.delete('ciudad');
    siguiente.delete('pagina');
    setParametros(siguiente, { replace: true });
  }

  function cambiarPagina(p: number) {
    const siguiente = new URLSearchParams(parametros);
    siguiente.set('pagina', String(p));
    setParametros(siguiente, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina
        antetitulo="Talento gallego"
        titulo="Diseñadores"
        descripcion="Las marcas que tejen GaliciaWear: artesanía local, materiales nobles y compromiso con la tierra."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip activo={!ciudad} onClick={() => elegirCiudad(undefined)}>
          Toda Galicia
        </Chip>
        {CODIGOS_CIUDAD.map((codigo) => (
          <Chip key={codigo} activo={ciudad === codigo} onClick={() => elegirCiudad(codigo)}>
            {CIUDADES[codigo]}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        {consulta.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, indice) => (
              <Esqueleto key={indice} className="h-40 rounded-xl2" />
            ))}
          </div>
        ) : (consulta.data?.datos.length ?? 0) === 0 ? (
          <EstadoVacio
            icono={<Users className="h-6 w-6" />}
            titulo="No hay diseñadores aquí todavía"
            descripcion="Prueba con otra ciudad gallega."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {consulta.data!.datos.map((disenador) => (
              <TarjetaDisenador key={disenador.usuarioId} disenador={disenador} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <Paginador pagina={pagina} total={total} limite={LIMITE} alCambiar={cambiarPagina} />
      </div>
    </ContenedorPagina>
  );
}
