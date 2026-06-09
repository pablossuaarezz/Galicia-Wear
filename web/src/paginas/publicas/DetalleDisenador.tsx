// Perfil público de un diseñador (marca) y sus prendas. Como la API pública de catálogo no
// filtra por diseñador, se piden las prendas de su ciudad y se filtran por disenadorId.
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Globe, MapPin, MessageSquare } from 'lucide-react';
import { Avatar, EnlaceBoton, Esqueleto, EstadoVacio } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { RejillaProductos } from '@/componentes/catalogo/RejillaProductos';
import { usarDisenador, usarCatalogo } from '@/hooks/usarCatalogo';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarTitulo } from '@/hooks/usarTitulo';
import { CIUDADES } from '@/util/constantes';

export default function DetalleDisenador() {
  const { id } = useParams<{ id: string }>();
  const { esDisenador } = usarSesion();
  const consulta = usarDisenador(id);
  const disenador = consulta.data;
  usarTitulo(disenador?.nombreMarca);

  const consultaProductos = usarCatalogo({ ciudad: disenador?.ciudad, limite: 50 });
  const prendas = useMemo(
    () => (consultaProductos.data?.datos ?? []).filter((p) => p.disenadorId === id),
    [consultaProductos.data, id],
  );

  if (consulta.isLoading) {
    return (
      <ContenedorPagina className="py-12">
        <Esqueleto className="h-44 w-full rounded-xl2" />
      </ContenedorPagina>
    );
  }

  if (consulta.isError || !disenador) {
    return (
      <ContenedorPagina className="py-16">
        <EstadoVacio
          titulo="Diseñador no encontrado"
          descripcion="Puede que el perfil no esté validado o que el enlace haya cambiado."
          accion={<EnlaceBoton to="/disenadores">Ver diseñadores</EnlaceBoton>}
        />
      </ContenedorPagina>
    );
  }

  return (
    <>
      <section className="border-b border-piedra-100 bg-gradient-to-b from-atlantic-50/60 to-sand-50">
        <ContenedorPagina ancho="ancho" className="py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar
              nombre={disenador.nombreMarca}
              url={disenador.urlLogo}
              tamano={96}
              className="shadow-suave ring-4 ring-white"
            />
            <div className="flex-1">
              <p className="inline-flex items-center gap-1 text-sm font-medium text-atlantic-600">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {CIUDADES[disenador.ciudad]}
              </p>
              <h1 className="mt-1 font-editorial text-4xl font-semibold leading-tight text-tinta-900">
                {disenador.nombreMarca}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-tinta-600">
                {disenador.biografia}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {!esDisenador && (
                  <EnlaceBoton
                    to={`/mensajes/${disenador.usuarioId}`}
                    state={{ nombre: disenador.nombreMarca }}
                    variante="primario"
                    tamano="sm"
                    iconoIzquierda={<MessageSquare className="h-4 w-4" />}
                  >
                    Contactar
                  </EnlaceBoton>
                )}
                {disenador.urlWeb && (
                  <EnlaceBoton
                    to={disenador.urlWeb}
                    variante="secundario"
                    tamano="sm"
                    target="_blank"
                    rel="noreferrer"
                    iconoIzquierda={<Globe className="h-4 w-4" />}
                    iconoDerecha={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    Web de la marca
                  </EnlaceBoton>
                )}
              </div>
            </div>
          </div>
        </ContenedorPagina>
      </section>

      <ContenedorPagina ancho="ancho" className="py-10">
        <h2 className="font-display text-xl font-semibold text-tinta-900">
          Prendas de {disenador.nombreMarca}
        </h2>
        <div className="mt-6">
          <RejillaProductos
            productos={prendas}
            cargando={consultaProductos.isLoading}
            cantidadEsqueletos={4}
            tituloVacio="Esta marca aún no tiene prendas publicadas"
            descripcionVacio="Vuelve pronto para descubrir sus creaciones."
          />
        </div>
      </ContenedorPagina>
    </>
  );
}
