// Perfil público de un diseñador (marca) y sus prendas. Como la API pública de catálogo no
// filtra por diseñador, se piden las prendas de su ciudad y se filtran por disenadorId.
//
// Flujo de usuario:
// 1. Se accede al perfil mediante el identificador del diseñador en la URL (/disenador/:id).
// 2. Mientras se cargan los datos del diseñador se muestra un esqueleto; si falla o no existe,
//    se presenta un estado vacío con enlace al listado de diseñadores.
// 3. Si el perfil es válido, se renderiza una cabecera con avatar, ubicación, biografía y
//    acciones (contactar por mensajería y, si la tiene, web de la marca) seguida de la rejilla
//    de prendas publicadas por esa marca.
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

/**
 * Página de perfil público de un diseñador (marca) y de sus prendas publicadas.
 *
 * Obtiene los datos del diseñador a partir del identificador presente en la URL y, dado que la
 * API pública del catálogo no permite filtrar por diseñador, recupera las prendas de la ciudad
 * del diseñador y las filtra en cliente por `disenadorId`. Gestiona los estados de carga y de
 * error/no encontrado, y oculta la acción de contacto si el propio usuario es diseñador.
 */
export default function DetalleDisenador() {
  // Identificador del diseñador tomado del parámetro de ruta /disenador/:id.
  const { id } = useParams<{ id: string }>();
  // Las cuentas de diseñador no pueden contactar con otras tiendas: ocultan el botón "Contactar".
  const { esDisenador } = usarSesion();
  const consulta = usarDisenador(id);
  const disenador = consulta.data;
  usarTitulo(disenador?.nombreMarca);

  // La API de catálogo no filtra por diseñador, por lo que se piden hasta 50 prendas de su ciudad.
  const consultaProductos = usarCatalogo({ ciudad: disenador?.ciudad, limite: 50 });
  // Se filtran en cliente las prendas para conservar solo las de este diseñador concreto.
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
