// Carrito de la compra: líneas editables, resumen con envío (gratis ≥ 50 €) y paso a checkout.
import { Link } from 'react-router-dom';
import { Leaf, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EnlaceBoton, EstadoVacio, Tarjeta } from '@/componentes/ui';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { EncabezadoPagina } from '@/componentes/disposicion/EncabezadoPagina';
import { usarCarrito } from '@/contexto/ContextoCarrito';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarTitulo } from '@/hooks/usarTitulo';
import { aNumero, formatoPrecio } from '@/util/formatos';
import { resolverImagen } from '@/util/imagenes';
import { ENVIO_GRATUITO_DESDE } from '@/util/constantes';
import { TALLAS } from '@/util/constantes';
import { cx } from '@/util/cx';
import type { ItemCarrito } from '@/api/tipos';

function precioLinea(item: ItemCarrito): number {
  return aNumero(item.variante.producto.precioBase) + aNumero(item.variante.ajustePrecio);
}

function LineaCarrito({ item }: { item: ItemCarrito }) {
  const { establecerCantidad, eliminar, ocupado } = usarCarrito();
  const producto = item.variante.producto;
  const imagen = producto.imagenes[0];
  const stockMax = Math.min(item.variante.stock, 99);

  return (
    <li className="flex gap-4 py-5">
      <Link
        to={`/producto/${producto.slug}`}
        className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-piedra-100 bg-sand-100"
      >
        {imagen?.url ? (
          <img src={resolverImagen(imagen.url)} alt={imagen.textoAlternativo ?? producto.nombre} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-atlantic-300">
            <Leaf className="h-6 w-6" aria-hidden />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-atlantic-600">
              {producto.disenador.nombreMarca}
            </p>
            <Link to={`/producto/${producto.slug}`} className="font-display text-sm font-semibold text-tinta-900 hover:text-atlantic-700">
              {producto.nombre}
            </Link>
            <p className="mt-0.5 text-xs text-tinta-400">
              {TALLAS[item.variante.talla]} · {item.variante.color}
            </p>
          </div>
          <button
            type="button"
            onClick={() => eliminar(item.variante.id)}
            disabled={ocupado}
            className="shrink-0 rounded-full p-2 text-tinta-400 transition-colors hover:bg-peligro-suave hover:text-peligro-fuerte"
            aria-label={`Quitar ${producto.nombre} del carrito`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex items-center rounded-full border border-piedra-200 bg-white">
            <button
              type="button"
              onClick={() => establecerCantidad(item.variante.id, Math.max(1, item.cantidad - 1))}
              disabled={ocupado || item.cantidad <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-l-full text-tinta-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
              aria-label="Quitar una unidad"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.cantidad}</span>
            <button
              type="button"
              onClick={() => establecerCantidad(item.variante.id, Math.min(stockMax, item.cantidad + 1))}
              disabled={ocupado || item.cantidad >= stockMax}
              className="flex h-9 w-9 items-center justify-center rounded-r-full text-tinta-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
              aria-label="Añadir una unidad"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <p className="font-display text-sm font-bold tabular-nums text-tinta-900">
            {formatoPrecio(precioLinea(item) * item.cantidad)}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function Carrito() {
  usarTitulo('Carrito');
  const { estaAutenticado, esDisenador } = usarSesion();
  const { items, resumen, estaVacio, cargando } = usarCarrito();

  if (!estaAutenticado) {
    return (
      <ContenedorPagina className="py-12">
        <EncabezadoPagina antetitulo="Tu compra" titulo="Carrito" />
        <div className="mt-8">
          <EstadoVacio
            icono={<ShoppingBag className="h-6 w-6" />}
            titulo="Inicia sesión para ver tu carrito"
            descripcion="Guarda tus prendas favoritas y tramita tu pedido cuando quieras."
            accion={<EnlaceBoton to="/login?destino=/carrito">Entrar</EnlaceBoton>}
          />
        </div>
      </ContenedorPagina>
    );
  }

  if (esDisenador) {
    return (
      <ContenedorPagina className="py-12">
        <EncabezadoPagina antetitulo="Tu compra" titulo="Carrito" />
        <div className="mt-8">
          <EstadoVacio
            icono={<ShoppingBag className="h-6 w-6" />}
            titulo="Las cuentas de diseñador no tienen carrito"
            descripcion="Gestiona tus ventas desde el panel de diseñador."
            accion={<EnlaceBoton to="/panel">Ir a mi panel</EnlaceBoton>}
          />
        </div>
      </ContenedorPagina>
    );
  }

  const faltaParaGratis = ENVIO_GRATUITO_DESDE - resumen.subtotal;

  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Tu compra" titulo="Carrito" />

      {!cargando && estaVacio ? (
        <div className="mt-8">
          <EstadoVacio
            icono={<ShoppingBag className="h-6 w-6" />}
            titulo="Tu carrito está vacío"
            descripcion="Aún no has añadido ninguna prenda. Descubre el catálogo y encuentra tu próxima pieza favorita."
            accion={<EnlaceBoton to="/catalogo">Explorar catálogo</EnlaceBoton>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Tarjeta className="px-5">
            <ul className="divide-y divide-piedra-100">
              {items.map((item) => (
                <LineaCarrito key={item.id} item={item} />
              ))}
            </ul>
          </Tarjeta>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Tarjeta className="p-6">
              <h2 className="font-display text-lg font-semibold text-tinta-900">Resumen</h2>

              {faltaParaGratis > 0 ? (
                <div className="mt-4 rounded-xl bg-galego-50 p-3 text-sm text-galego-700">
                  Te faltan <strong>{formatoPrecio(faltaParaGratis)}</strong> para el envío gratis.
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-galego-100">
                    <div
                      className="h-full rounded-full bg-galego-500 transition-all"
                      style={{ width: `${Math.min(100, (resumen.subtotal / ENVIO_GRATUITO_DESDE) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-galego-50 px-3 py-1 text-sm font-medium text-galego-700">
                  <Leaf className="h-4 w-4" aria-hidden />
                  ¡Tienes envío gratuito!
                </p>
              )}

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-tinta-500">Subtotal</dt>
                  <dd className="font-medium tabular-nums text-tinta-800">{formatoPrecio(resumen.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta-500">Envío</dt>
                  <dd className="font-medium tabular-nums text-tinta-800">
                    {resumen.costeEnvio === 0 ? 'Gratis' : formatoPrecio(resumen.costeEnvio)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-piedra-100 pt-3 text-base">
                  <dt className="font-semibold text-tinta-900">Total</dt>
                  <dd className="font-display font-bold tabular-nums text-tinta-900">
                    {formatoPrecio(resumen.total)}
                  </dd>
                </div>
              </dl>

              <EnlaceBoton to="/checkout" ancho tamano="lg" className={cx('mt-6')}>
                Tramitar pedido
              </EnlaceBoton>
              <Link
                to="/catalogo"
                className="mt-3 block text-center text-sm font-medium text-atlantic-700 hover:underline"
              >
                Seguir comprando
              </Link>
            </Tarjeta>
          </aside>
        </div>
      )}
    </ContenedorPagina>
  );
}
