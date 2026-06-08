// Mis pedidos (cliente): lista cronológica con estado, número y total. Enlaza al detalle.
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { EnlaceBoton, EstadoVacio, Esqueleto, Tarjeta } from '@/componentes/ui';
import { EstadoPedidoInsignia } from '@/componentes/pedidos/EstadoPedidoInsignia';
import { usarPedidos } from '@/hooks/usarPedidos';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoFecha, formatoPrecio } from '@/util/formatos';

export default function MisPedidos() {
  usarTitulo('Mis pedidos');
  const { data: pedidos = [], isLoading } = usarPedidos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-24 rounded-xl2" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <EstadoVacio
        icono={<Package className="h-6 w-6" />}
        titulo="Aún no tienes pedidos"
        descripcion="Cuando hagas tu primera compra aparecerá aquí con su estado y seguimiento."
        accion={<EnlaceBoton to="/catalogo">Descubrir prendas</EnlaceBoton>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map((pedido) => {
        const unidades = pedido.lineas.reduce((suma, l) => suma + l.cantidad, 0);
        return (
          <Link key={pedido.id} to={`/cuenta/pedidos/${pedido.id}`}>
            <Tarjeta className="flex items-center gap-4 p-5 transition-all hover:border-atlantic-200 hover:shadow-tarjeta">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-atlantic-50 text-atlantic-600">
                <Package className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-semibold text-tinta-900">{pedido.numeroPedido}</p>
                  <EstadoPedidoInsignia estado={pedido.estado} />
                </div>
                <p className="mt-0.5 text-xs text-tinta-400">
                  {formatoFecha(pedido.fechaCreacion)} · {unidades} {unidades === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
              <p className="font-display text-sm font-bold tabular-nums text-tinta-900">
                {formatoPrecio(pedido.total)}
              </p>
              <ChevronRight className="h-5 w-5 shrink-0 text-tinta-300" aria-hidden />
            </Tarjeta>
          </Link>
        );
      })}
    </div>
  );
}
