// Rejilla responsive de prendas con entrada escalonada (stagger), esqueletos de carga y estado
// vacío. Aísla la presentación del catálogo para reutilizarla (inicio, catálogo, diseñador).
import { PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { EstadoVacio, Esqueleto } from '@/componentes/ui';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';
import type { ProductoResumen } from '@/api/tipos';
import { TarjetaProducto } from './TarjetaProducto';

const REJILLA = 'grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4';

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
  productos: ProductoResumen[];
  cargando?: boolean;
  cantidadEsqueletos?: number;
  tituloVacio?: string;
  descripcionVacio?: string;
}

export function RejillaProductos({
  productos,
  cargando = false,
  cantidadEsqueletos = 8,
  tituloVacio = 'No hay prendas que coincidan',
  descripcionVacio = 'Prueba a quitar algún filtro o a buscar otra cosa.',
}: PropsRejilla) {
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
