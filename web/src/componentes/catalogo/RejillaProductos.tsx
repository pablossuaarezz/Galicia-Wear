// Rejilla responsive de prendas con entrada escalonada (stagger), esqueletos de carga y estado
// vacío. Aísla la presentación del catálogo para reutilizarla (inicio, catálogo, diseñador).
import { PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { EstadoVacio, Esqueleto } from '@/componentes/ui';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';
import type { ProductoResumen } from '@/api/tipos';
import { TarjetaProducto } from './TarjetaProducto';

// Clases compartidas de la rejilla: 2 columnas en móvil, 3 en tablet y 4 en escritorio.
const REJILLA = 'grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4';

/**
 * Placeholder de carga que imita la forma de una `TarjetaProducto` (imagen + texto + precio)
 * mientras se obtienen los datos reales del catálogo.
 */
function TarjetaEsqueleto() {
  return (
    <div className="overflow-hidden rounded-xl2 border border-piedra-100 bg-white p-0">
      <Esqueleto className="aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-4">
        <Esqueleto className="h-3 w-20" />
        <Esqueleto className="h-4 w-full" />
        <Esqueleto className="h-5 w-16" />
      </div>
    </div>
  );
}

interface PropsRejilla {
  /** Lista de productos a mostrar (ya filtrados/paginados por la página). */
  productos: ProductoResumen[];
  /** Si es `true`, se muestran esqueletos de carga en lugar de las tarjetas. */
  cargando?: boolean;
  /** Número de tarjetas esqueleto a renderizar mientras carga. */
  cantidadEsqueletos?: number;
  /** Título mostrado cuando la lista de productos está vacía. */
  tituloVacio?: string;
  /** Descripción mostrada junto al título en el estado vacío. */
  descripcionVacio?: string;
}

/**
 * Rejilla responsive de prendas con tres estados posibles: carga (esqueletos), vacío
 * (mensaje + icono) y lista de productos con animación de entrada escalonada.
 *
 * Se reutiliza en varias páginas (inicio, catálogo, perfil de diseñador) para mantener una
 * presentación consistente del catálogo.
 *
 * @param productos - Productos a renderizar.
 * @param cargando - Activa el estado de carga (esqueletos).
 * @param cantidadEsqueletos - Cantidad de esqueletos mostrados durante la carga.
 * @param tituloVacio - Título del estado vacío.
 * @param descripcionVacio - Descripción del estado vacío.
 * @returns Rejilla de tarjetas de producto, esqueletos o estado vacío según corresponda.
 */
export function RejillaProductos({
  productos,
  cargando = false,
  cantidadEsqueletos = 8,
  tituloVacio = 'No hay prendas que coincidan',
  descripcionVacio = 'Prueba a quitar algún filtro o a buscar otra cosa.',
}: PropsRejilla) {
  // Respeta la preferencia de "movimiento reducido" del sistema operativo del usuario.
  const reducido = usarMovimientoReducido();

  if (cargando) {
    return (
      <div className={REJILLA}>
        {Array.from({ length: cantidadEsqueletos }).map((_, indice) => (
          <TarjetaEsqueleto key={indice} />
        ))}
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <EstadoVacio
        icono={<PackageOpen className="h-6 w-6" />}
        titulo={tituloVacio}
        descripcion={descripcionVacio}
      />
    );
  }

  return (
    // staggerChildren escalona la animación de entrada de cada tarjeta hija (efecto cascada).
    <motion.ul
      className={REJILLA}
      initial="oculto"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {productos.map((producto) => (
        <motion.li
          key={producto.id}
          variants={{
            // Si el usuario prefiere movimiento reducido, se omite el desplazamiento vertical (y).
            oculto: reducido ? { opacity: 0 } : { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          <TarjetaProducto producto={producto} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
