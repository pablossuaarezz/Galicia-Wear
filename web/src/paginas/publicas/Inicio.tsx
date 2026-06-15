// Inicio: hero editorial (Fraunces), franja de valores de sostenibilidad, novedades del
// catálogo, diseñadores destacados y una llamada final para vender en GaliciaWear.
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { EnlaceBoton } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { Revelar } from '@/componentes/disposicion/Revelar';
import { RejillaProductos } from '@/componentes/catalogo/RejillaProductos';
import { TarjetaDisenador } from '@/componentes/catalogo/TarjetaDisenador';
import { usarCatalogo, usarDisenadores } from '@/hooks/usarCatalogo';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';
import { usarTitulo } from '@/hooks/usarTitulo';

const VALORES = [
  { Icono: MapPin, titulo: 'Km0 gallego', texto: 'Prendas diseñadas y cosidas cerca de ti.' },
  { Icono: ShieldCheck, titulo: 'Certificadas', texto: 'GOTS, OEKO-TEX, GRS y más sellos verificables.' },
  { Icono: Truck, titulo: 'Envío eco', texto: 'Transporte ecológico, gratis desde 50 €.' },
  { Icono: Sparkles, titulo: 'Artesanía', texto: 'Pequeñas marcas, hecho con tiempo y cariño.' },
];

/** Cabecera principal (hero) con el lema editorial y los botones de acceso al catálogo. */
function Hero() {
  const reducido = usarMovimientoReducido();
  return (
    <section className="relative overflow-hidden border-b border-piedra-100 bg-gradient-to-br from-atlantic-100 via-sand-50 to-celeste-100">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-celeste-200/60 blur-3xl"
        aria-hidden
      />
      <ContenedorPagina ancho="ancho" className="relative py-20 sm:py-28">
        <motion.div
          initial={reducido ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-galego-700 shadow-suave backdrop-blur">
            <Leaf className="h-3.5 w-3.5" aria-hidden />
            Moda sostenible gallega
          </span>
          <h1 className="mt-5 font-editorial text-5xl font-semibold leading-[1.05] text-atlantic-900 sm:text-6xl">
            Viste a beiramar,
            <br />
            <span className="text-galego-600">teje futuro.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-tinta-600">
            Un marketplace de moda gallega de proximidad: diseñadores locales, materiales
            certificados y envíos ecológicos. Cada prenda cuenta una historia del Atlántico.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <EnlaceBoton to="/catalogo" tamano="lg" iconoDerecha={<ArrowRight className="h-5 w-5" />}>
              Explorar el catálogo
            </EnlaceBoton>
            <EnlaceBoton to="/disenadores" tamano="lg" variante="secundario">
              Conocer diseñadores
            </EnlaceBoton>
          </div>
        </motion.div>
      </ContenedorPagina>
    </section>
  );
}

/** Franja con los cuatro valores de sostenibilidad de la marca. */
function FranjaValores() {
  return (
    <section className="border-b border-piedra-100 bg-white">
      <ContenedorPagina ancho="ancho" className="grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {VALORES.map(({ Icono, titulo, texto }, indice) => (
          <Revelar key={titulo} retraso={indice * 0.06}>
            <div className="flex flex-col gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-galego-50 text-galego-600">
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-display text-sm font-semibold text-tinta-900">{titulo}</h3>
              <p className="text-sm leading-snug text-tinta-500">{texto}</p>
            </div>
          </Revelar>
        ))}
      </ContenedorPagina>
    </section>
  );
}

/** Sección de novedades: muestra las últimas 8 prendas del catálogo. */
function Novedades() {
  const consulta = usarCatalogo({ limite: 8, pagina: 1 });
  return (
    <ContenedorPagina ancho="ancho" className="py-16">
      <Revelar>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-atlantic-600">
              Recién llegado
            </p>
            <h2 className="mt-1 font-editorial text-3xl font-semibold text-tinta-900">Novedades</h2>
          </div>
          <Link to="/catalogo" className="hidden items-center gap-1 text-sm font-semibold text-atlantic-700 hover:underline sm:inline-flex">
            Ver todo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Revelar>
      <div className="mt-8">
        <RejillaProductos
          productos={consulta.data?.datos ?? []}
          cargando={consulta.isLoading}
          cantidadEsqueletos={8}
          tituloVacio="Pronto habrá novedades"
          descripcionVacio="Los diseñadores están preparando sus colecciones."
        />
      </div>
    </ContenedorPagina>
  );
}

/** Muestra hasta 3 diseñadores destacados; no renderiza nada si no hay ninguno. */
function DisenadoresDestacados() {
  const consulta = usarDisenadores({ limite: 3 });
  const disenadores = consulta.data?.datos ?? [];
  if (!consulta.isLoading && disenadores.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <ContenedorPagina ancho="ancho">
        <Revelar>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-atlantic-600">
                Manos que crean
              </p>
              <h2 className="mt-1 font-editorial text-3xl font-semibold text-tinta-900">
                Diseñadores destacados
              </h2>
            </div>
            <Link to="/disenadores" className="hidden items-center gap-1 text-sm font-semibold text-atlantic-700 hover:underline sm:inline-flex">
              Ver todos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Revelar>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {disenadores.map((disenador, indice) => (
            <Revelar key={disenador.usuarioId} retraso={indice * 0.06}>
              <TarjetaDisenador disenador={disenador} />
            </Revelar>
          ))}
        </div>
      </ContenedorPagina>
    </section>
  );
}

/** Llamada a la acción final dirigida a diseñadores para que abran su tienda. */
function LlamadaVender() {
  return (
    <ContenedorPagina ancho="ancho" className="py-16">
      <Revelar>
        <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-atlantic-700 to-atlantic-900 px-8 py-14 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-galego-500/20 blur-3xl" aria-hidden />
          <h2 className="relative font-editorial text-3xl font-semibold sm:text-4xl">
            ¿Diseñas moda sostenible en Galicia?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-atlantic-50">
            Abre tu tienda en GaliciaWear, llega a clientes de toda Galicia y cuenta la historia de
            tu marca.
          </p>
          <div className="relative mt-7">
            <EnlaceBoton to="/registro" variante="galego" tamano="lg" iconoDerecha={<ArrowRight className="h-5 w-5" />}>
              Vender en GaliciaWear
            </EnlaceBoton>
          </div>
        </div>
      </Revelar>
    </ContenedorPagina>
  );
}

/** Página de inicio que compone, en orden, las secciones del escaparate. */
export default function Inicio() {
  usarTitulo();
  return (
    <>
      <Hero />
      <FranjaValores />
      <Novedades />
      <DisenadoresDestacados />
      <LlamadaVender />
    </>
  );
}
