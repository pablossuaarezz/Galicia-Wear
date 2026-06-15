// Detalle de prenda: galería, selección de variante (talla·color·stock), precio dinámico,
// certificados e información de sostenibilidad, y bloque del diseñador. El botón de añadir
// respeta la sesión (pide login si hace falta) e incrementa sobre lo ya presente en el carrito.
//
// Flujo de usuario:
// 1. Se carga la prenda a partir de su slug en la URL (/producto/:slug); mientras tanto se
//    muestra un esqueleto y, si falla, un estado vacío con enlace al catálogo.
// 2. El usuario elige una variante (talla y color) y la cantidad; el precio se recalcula según
//    el ajuste de precio de la variante seleccionada.
// 3. Al pulsar "Añadir al carrito": si no hay sesión se redirige a login; si es diseñador se
//    avisa de que no dispone de carrito; en otro caso se agrega la variante respetando el stock.
// 4. Se ofrecen además los certificados de sostenibilidad y un acceso al perfil del diseñador.
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Leaf, MapPin, MessageSquare, Minus, Plus, ShieldCheck, ShoppingBag, Store } from 'lucide-react';
import { Boton, EnlaceBoton, Esqueleto, EstadoVacio, Insignia, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { usarProducto } from '@/hooks/usarCatalogo';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarCarrito } from '@/contexto/ContextoCarrito';
import { usarTitulo } from '@/hooks/usarTitulo';
import { aNumero, formatoFecha, formatoPrecio } from '@/util/formatos';
import { resolverImagen } from '@/util/imagenes';
import { CERTIFICADOS, CIUDADES, MATERIALES, TALLAS } from '@/util/constantes';
import { cx } from '@/util/cx';
import type { ProductoDetalle, Variante } from '@/api/tipos';

/**
 * Esqueleto de carga del detalle de producto. Reproduce el armazón visual de la página (galería
 * a la izquierda y bloque de información a la derecha) mientras se resuelve la consulta a la API.
 */
function CargandoDetalle() {
  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <Esqueleto className="aspect-[4/5] w-full rounded-xl2" />
        <div className="space-y-4">
          <Esqueleto className="h-4 w-32" />
          <Esqueleto className="h-9 w-3/4" />
          <Esqueleto className="h-6 w-28" />
          <Esqueleto className="h-24 w-full" />
          <Esqueleto className="h-12 w-full" />
        </div>
      </div>
    </ContenedorPagina>
  );
}

/**
 * Galería de imágenes de la prenda con imagen principal y miniaturas navegables.
 *
 * Mantiene el índice de la imagen activa y un registro de las imágenes que han fallado al
 * cargar, de modo que cada miniatura o la imagen principal degraden a un marcador (hoja) si su
 * URL no es válida en lugar de mostrar un hueco roto.
 *
 * @param producto Producto del que se muestran las imágenes.
 */
function Galeria({ producto }: { producto: ProductoDetalle }) {
  // Índice de la imagen actualmente mostrada en grande.
  const [activa, setActiva] = useState(0);
  // Registro de índices cuya imagen ha fallado al cargar, para mostrar el marcador de respaldo.
  const [fallos, setFallos] = useState<Record<number, boolean>>({});
  const imagenes = producto.imagenes;
  const actual = imagenes[activa];
  // Solo se considera que hay foto válida si existe la imagen y no ha fallado previamente.
  const hayFoto = actual && !fallos[activa];

  return (
    <div>
      <motion.div
        key={activa}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        className="aspect-[4/5] overflow-hidden rounded-xl2 border border-piedra-100 bg-sand-100"
      >
        {hayFoto ? (
          <img
            src={resolverImagen(actual.url)}
            alt={actual.textoAlternativo ?? producto.nombre}
            className="h-full w-full object-cover"
            onError={() => setFallos((f) => ({ ...f, [activa]: true }))}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sand-100 to-atlantic-50 text-atlantic-300">
            <Leaf className="h-12 w-12" aria-hidden />
          </div>
        )}
      </motion.div>

      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {imagenes.map((imagen, indice) => (
            <button
              key={imagen.id}
              type="button"
              onClick={() => setActiva(indice)}
              className={cx(
                'h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-sand-100 transition-colors',
                indice === activa ? 'border-atlantic-500' : 'border-transparent hover:border-piedra-300',
              )}
              aria-label={`Ver imagen ${indice + 1}`}
            >
              {!fallos[indice] ? (
                <img src={resolverImagen(imagen.url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-atlantic-300">
                  <Leaf className="h-5 w-5" aria-hidden />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Página de detalle de una prenda.
 *
 * Carga el producto por su slug, gestiona la selección de variante (talla/color/stock) y la
 * cantidad, calcula el precio dinámico según la variante elegida, y controla el flujo de
 * "Añadir al carrito" teniendo en cuenta la sesión (login requerido), el rol (los diseñadores
 * no compran) y los límites de stock. Muestra además galería, certificados y datos del diseñador.
 */
export default function DetalleProducto() {
  // Slug de la prenda tomado del parámetro de ruta /producto/:slug.
  const { slug } = useParams<{ slug: string }>();
  const consulta = usarProducto(slug);
  const producto = consulta.data;
  usarTitulo(producto?.nombre);

  const { estaAutenticado, esDisenador } = usarSesion();
  const carrito = usarCarrito();
  const brindis = usarBrindis();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  // Selecciona por defecto la primera variante con stock.
  useEffect(() => {
    if (producto && varianteId === null) {
      const conStock = producto.variantes.find((v) => v.stock > 0) ?? producto.variantes[0];
      if (conStock) setVarianteId(conStock.id);
    }
  }, [producto, varianteId]);

  const variante = useMemo<Variante | undefined>(
    () => producto?.variantes.find((v) => v.id === varianteId),
    [producto, varianteId],
  );

  if (consulta.isLoading) return <CargandoDetalle />;
  if (consulta.isError || !producto) {
    return (
      <ContenedorPagina className="py-16">
        <EstadoVacio
          titulo="No encontramos esta prenda"
          descripcion="Puede que ya no esté disponible o que el enlace haya cambiado."
          accion={<EnlaceBoton to="/catalogo">Volver al catálogo</EnlaceBoton>}
        />
      </ContenedorPagina>
    );
  }

  const precio = aNumero(producto.precioBase) + aNumero(variante?.ajustePrecio ?? '0');
  const stockMax = variante ? Math.min(variante.stock, 99) : 0;
  const sinStock = !variante || variante.stock <= 0;

  async function anadir() {
    if (!variante) return;
    if (!estaAutenticado) {
      navegar(`/login?destino=${encodeURIComponent(ubicacion.pathname)}`);
      return;
    }
    if (esDisenador) {
      brindis.info('Las cuentas de diseñador no disponen de carrito de compra.');
      return;
    }
    const yaEnCarrito = carrito.items.find((i) => i.variante.id === variante.id)?.cantidad ?? 0;
    const nuevaCantidad = Math.min(yaEnCarrito + cantidad, variante.stock, 99);
    try {
      await carrito.agregar(variante.id, nuevaCantidad);
      brindis.exito(`Añadido al carrito · ${producto!.nombre}`);
    } catch {
      /* el contexto del carrito ya muestra el error */
    }
  }

  return (
    <ContenedorPagina ancho="ancho" className="py-8">
      <Link
        to="/catalogo"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-atlantic-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Catálogo
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <Galeria producto={producto} />

        <div>
          <Link
            to={`/disenador/${producto.disenadorId}`}
            className="text-sm font-semibold uppercase tracking-wide text-atlantic-600 hover:underline"
          >
            {producto.disenador.nombreMarca}
          </Link>
          <h1 className="mt-1.5 font-editorial text-3xl font-semibold leading-tight text-tinta-900 sm:text-4xl">
            {producto.nombre}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Insignia tono="info">{MATERIALES[producto.materialPrincipal]}</Insignia>
            <Insignia tono="galego" className="gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {producto.kmOrigen === 0 ? 'km0' : `${producto.kmOrigen} km`} · {CIUDADES[producto.disenador.ciudad]}
            </Insignia>
          </div>

          <p className="mt-5 font-display text-3xl font-bold tabular-nums text-tinta-900">
            {formatoPrecio(precio)}
          </p>

          <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-tinta-600">
            {producto.descripcion}
          </p>

          {/* Selección de variante */}
          <div className="mt-7">
            <p className="mb-2 text-sm font-semibold text-tinta-700">Elige tu variante</p>
            <div className="flex flex-wrap gap-2">
              {producto.variantes.map((v) => {
                const agotada = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={agotada}
                    onClick={() => {
                      setVarianteId(v.id);
                      setCantidad(1);
                    }}
                    className={cx(
                      'rounded-xl border px-3.5 py-2 text-sm font-medium transition-all',
                      v.id === varianteId
                        ? 'border-atlantic-500 bg-atlantic-50 text-atlantic-700 ring-1 ring-atlantic-500/30'
                        : 'border-piedra-200 bg-white text-tinta-700 hover:border-atlantic-300',
                      agotada && 'cursor-not-allowed text-tinta-300 line-through',
                    )}
                  >
                    {TALLAS[v.talla]} · {v.color}
                  </button>
                );
              })}
            </div>
            {variante && (
              <p className={cx('mt-2 text-xs', sinStock ? 'text-peligro-fuerte' : 'text-tinta-400')}>
                {sinStock ? 'Sin stock disponible' : `${variante.stock} unidades disponibles · SKU ${variante.sku}`}
              </p>
            )}
          </div>

          {/* Cantidad + añadir */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-piedra-200 bg-white">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                disabled={cantidad <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-l-full text-tinta-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
                aria-label="Quitar una unidad"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-10 text-center font-semibold tabular-nums text-tinta-900" aria-live="polite">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(stockMax, c + 1))}
                disabled={cantidad >= stockMax || sinStock}
                className="flex h-11 w-11 items-center justify-center rounded-r-full text-tinta-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
                aria-label="Añadir una unidad"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <Boton
              tamano="lg"
              onClick={anadir}
              disabled={sinStock}
              cargando={carrito.ocupado}
              iconoIzquierda={<ShoppingBag className="h-5 w-5" />}
              className="flex-1"
            >
              {sinStock ? 'Sin stock' : 'Añadir al carrito'}
            </Boton>
          </div>

          {!esDisenador && (
            <EnlaceBoton
              to={`/mensajes/${producto.disenadorId}`}
              state={{ nombre: producto.disenador.nombreMarca }}
              variante="secundario"
              ancho
              className="mt-3"
              iconoIzquierda={<MessageSquare className="h-4 w-4" />}
            >
              Contactar con la tienda
            </EnlaceBoton>
          )}

          {/* Certificados */}
          {producto.certificados.length > 0 && (
            <Tarjeta className="mt-7 p-5">
              <h2 className="inline-flex items-center gap-2 font-display text-sm font-semibold text-tinta-800">
                <ShieldCheck className="h-4 w-4 text-galego-600" aria-hidden />
                Certificados de sostenibilidad
              </h2>
              <ul className="mt-3 space-y-2.5">
                {producto.certificados.map((c) => (
                  <li key={c.certificado.codigo} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-tinta-800">
                        {CERTIFICADOS[c.certificado.codigo]} · {c.certificado.nombre}
                      </p>
                      <p className="text-xs text-tinta-400">
                        Nº {c.numeroCertificado} · emitido el {formatoFecha(c.fechaEmision)}
                      </p>
                    </div>
                    <a
                      href={c.certificado.urlEmisor}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-medium text-atlantic-600 hover:underline"
                    >
                      Verificar
                    </a>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}

          {/* Bloque del diseñador */}
          <Link
            to={`/disenador/${producto.disenadorId}`}
            className="mt-5 flex items-center gap-3 rounded-xl2 border border-piedra-100 bg-white p-4 transition-colors hover:border-atlantic-200"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-atlantic-50 text-atlantic-600">
              <Store className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-tinta-800">
                {producto.disenador.nombreMarca}
              </span>
              <span className="block text-xs text-tinta-400">
                Diseñador en {CIUDADES[producto.disenador.ciudad]} · Ver perfil y más prendas
              </span>
            </span>
          </Link>
        </div>
      </div>
    </ContenedorPagina>
  );
}
