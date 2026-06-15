// Tarjeta de prenda del catálogo: foto con zoom sutil al pasar el ratón, marca, precio y
// certificados de sostenibilidad. La tarjeta entera es un enlace al detalle.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, MapPin } from 'lucide-react';
import { cx } from '@/util/cx';
import { Insignia } from '@/componentes/ui';
import { formatoPrecio } from '@/util/formatos';
import { resolverImagen } from '@/util/imagenes';
import { CERTIFICADOS, CIUDADES, MATERIALES } from '@/util/constantes';
import type { ProductoResumen } from '@/api/tipos';

/**
 * Tarjeta de producto del catálogo.
 *
 * Muestra la primera imagen de la prenda (con zoom sutil al pasar el ratón), un distintivo de
 * "km0" o distancia si el origen está a 100 km o menos, la marca, el nombre, el material y
 * ciudad del diseñador, hasta 3 certificados de sostenibilidad y el precio formateado.
 * Si la imagen falla al cargar (o no existe), se muestra un placeholder con el material
 * principal de la prenda. La tarjeta completa enlaza al detalle del producto.
 *
 * @param producto - Resumen del producto a mostrar en la tarjeta.
 * @returns Tarjeta enlazada a `/producto/:slug`.
 */
export function TarjetaProducto({ producto }: { producto: ProductoResumen }) {
  // Controla si la carga de la imagen ha fallado, para mostrar el placeholder en su lugar.
  const [falloImagen, setFalloImagen] = useState(false);
  const imagen = producto.imagenes[0];
  // Solo se muestra la foto si existe una URL válida y no ha fallado previamente al cargar.
  const hayFoto = Boolean(imagen?.url) && !falloImagen;
  const alt = imagen?.textoAlternativo ?? producto.nombre;
  // Se limita a 3 certificados para no sobrecargar visualmente la tarjeta.
  const certificados = producto.certificados.slice(0, 3);

  return (
    <Link
      to={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-piedra-100 bg-white shadow-suave transition-all duration-300 ease-suave hover:-translate-y-1 hover:shadow-flotante"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand-100">
        {hayFoto ? (
          <img
            src={resolverImagen(imagen!.url)}
            alt={alt}
            loading="lazy"
            onError={() => setFalloImagen(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-suave group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sand-100 to-atlantic-50 text-atlantic-300">
            <Leaf className="h-10 w-10" aria-hidden />
            <span className="mt-2 text-xs font-medium text-tinta-400">{MATERIALES[producto.materialPrincipal]}</span>
          </div>
        )}

        {/* Distintivo de proximidad: solo se muestra si el origen está a 100 km o menos. */}
        {producto.kmOrigen <= 100 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-galego-700 shadow-suave backdrop-blur">
            <MapPin className="h-3 w-3" aria-hidden />
            {producto.kmOrigen === 0 ? 'km0' : `${producto.kmOrigen} km`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-atlantic-600">
          {producto.disenador.nombreMarca}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-tinta-900 group-hover:text-atlantic-700">
          {producto.nombre}
        </h3>

        <p className="mt-1 text-xs text-tinta-400">
          {MATERIALES[producto.materialPrincipal]} · {CIUDADES[producto.disenador.ciudad]}
        </p>

        {certificados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {certificados.map((c) => (
              <Insignia key={c.certificado.codigo} tono="galego" className="gap-1">
                <Leaf className="h-3 w-3" aria-hidden />
                {CERTIFICADOS[c.certificado.codigo]}
              </Insignia>
            ))}
          </div>
        )}

        <p className={cx('mt-4 font-display text-lg font-bold text-tinta-900', 'tabular-nums')}>
          {formatoPrecio(producto.precioBase)}
        </p>
      </div>
    </Link>
  );
}
