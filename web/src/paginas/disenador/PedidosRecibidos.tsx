// Pedidos recibidos (diseñador): por cada venta muestra sus líneas, permite aceptar el pedido
// (PAGADO → ACEPTADO, crea el envío) y gestionar el envío (transportista, seguimiento, marcar
// enviado/entregado).
import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PackageCheck, ShoppingBag, Truck } from 'lucide-react';
import { Boton, Campo, EstadoVacio, Esqueleto, Selector, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { EstadoPedidoInsignia } from '@/componentes/pedidos/EstadoPedidoInsignia';
import { usarPedidos } from '@/hooks/usarPedidos';
import { usarSesion } from '@/contexto/ContextoSesion';
import { apiPedidos } from '@/api/endpoints/pedidos';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoFecha, formatoPrecio } from '@/util/formatos';
import { CODIGOS_TRANSPORTISTA, TALLAS, TRANSPORTISTAS } from '@/util/constantes';
import { mensajeDeError } from '@/util/validacion';
import type { EntradaActualizarEnvio, Pedido, Transportista } from '@/api/tipos';

/** Formulario de gestión del envío de un pedido: transportista, seguimiento y marcas de enviado/entregado. */
function GestionEnvio({ pedido }: { pedido: Pedido }) {
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const envio = pedido.envio!;
  const [transportista, setTransportista] = useState<Transportista>(envio.transportista);
  const [seguimiento, setSeguimiento] = useState(envio.numeroSeguimiento ?? '');

  const actualizar = useMutation({
    mutationFn: (datos: EntradaActualizarEnvio) => apiPedidos.actualizarEnvio(pedido.id, datos),
    onSuccess: () => {
      clienteConsultas.invalidateQueries({ queryKey: ['pedidos'] });
      brindis.exito('Envío actualizado');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function guardar(evento: FormEvent) {
    evento.preventDefault();
    actualizar.mutate({ transportista, numeroSeguimiento: seguimiento.trim() || undefined });
  }

  return (
    <form onSubmit={guardar} className="mt-4 space-y-3 rounded-xl bg-sand-50 p-4">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-tinta-800">
        <Truck className="h-4 w-4 text-atlantic-500" aria-hidden />
        Envío
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Selector
          etiqueta="Transportista"
          value={transportista}
          onChange={(e) => setTransportista(e.target.value as Transportista)}
        >
          {CODIGOS_TRANSPORTISTA.map((codigo) => (
            <option key={codigo} value={codigo}>
              {TRANSPORTISTAS[codigo]}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Nº de seguimiento"
          value={seguimiento}
          onChange={(e) => setSeguimiento(e.target.value)}
          placeholder="GW123456789ES"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Boton type="submit" variante="secundario" tamano="sm" cargando={actualizar.isPending}>
          Guardar datos
        </Boton>
        {!envio.fechaEnvio && (
          <Boton
            type="button"
            tamano="sm"
            iconoIzquierda={<Truck className="h-4 w-4" />}
            onClick={() => actualizar.mutate({ marcarComoEnviado: true, numeroSeguimiento: seguimiento.trim() || undefined, transportista })}
            cargando={actualizar.isPending}
          >
            Marcar enviado
          </Boton>
        )}
        {envio.fechaEnvio && !envio.fechaEntrega && (
          <Boton
            type="button"
            variante="galego"
            tamano="sm"
            iconoIzquierda={<PackageCheck className="h-4 w-4" />}
            onClick={() => actualizar.mutate({ marcarComoEntregado: true })}
            cargando={actualizar.isPending}
          >
            Marcar entregado
          </Boton>
        )}
      </div>
      {envio.fechaEnvio && (
        <p className="text-xs text-tinta-400">
          Enviado el {formatoFecha(envio.fechaEnvio)}
          {envio.fechaEntrega ? ` · Entregado el ${formatoFecha(envio.fechaEntrega)}` : ''}
        </p>
      )}
    </form>
  );
}

/**
 * Tarjeta de un pedido recibido: muestra solo las líneas del diseñador actual, permite aceptar
 * el pedido cuando procede y, si ya existe envío, embebe su gestión.
 */
function TarjetaPedidoRecibido({ pedido, disenadorId }: { pedido: Pedido; disenadorId: string }) {
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  // De un pedido multi-diseñador, este panel solo gestiona las líneas propias.
  const misLineas = pedido.lineas.filter((l) => l.disenadorId === disenadorId);

  const aceptar = useMutation({
    mutationFn: () => apiPedidos.aceptar(pedido.id),
    onSuccess: () => {
      clienteConsultas.invalidateQueries({ queryKey: ['pedidos'] });
      brindis.exito('Pedido aceptado');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const puedeAceptar = pedido.estado === 'PAGADO' && misLineas.some((l) => l.estadoLinea === 'PAGADO');

  return (
    <Tarjeta className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-semibold text-tinta-900">{pedido.numeroPedido}</p>
          <EstadoPedidoInsignia estado={pedido.estado} />
        </div>
        <p className="text-xs text-tinta-400">{formatoFecha(pedido.fechaCreacion)}</p>
      </div>

      <ul className="mt-3 divide-y divide-piedra-100">
        {misLineas.map((linea) => (
          <li key={linea.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="font-medium text-tinta-800">{linea.variante.producto.nombre}</span>
              <span className="ml-2 text-xs text-tinta-400">
                {TALLAS[linea.variante.talla]} · {linea.variante.color} · ×{linea.cantidad}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-tinta-700">
              {formatoPrecio(Number(linea.precioUnitario) * linea.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-right text-sm">
        Enviar a <span className="font-medium text-tinta-700">{pedido.direccionEnvio.ciudad}</span> ({pedido.direccionEnvio.codigoPostal})
      </p>

      {puedeAceptar && (
        <div className="mt-4">
          <Boton
            onClick={() => aceptar.mutate()}
            cargando={aceptar.isPending}
            iconoIzquierda={<CheckCircle2 className="h-4 w-4" />}
          >
            Aceptar pedido
          </Boton>
        </div>
      )}

      {pedido.envio && <GestionEnvio pedido={pedido} />}
    </Tarjeta>
  );
}

/** Página con los pedidos que han comprado prendas del diseñador, para aceptarlos y gestionar envíos. */
export default function PedidosRecibidos() {
  usarTitulo('Pedidos recibidos');
  const { usuario } = usarSesion();
  const { data: pedidos = [], isLoading } = usarPedidos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-40 rounded-xl2" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <EstadoVacio
        icono={<ShoppingBag className="h-6 w-6" />}
        titulo="Todavía no has recibido pedidos"
        descripcion="Cuando alguien compre tus prendas, los pedidos aparecerán aquí para que los gestiones."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <TarjetaPedidoRecibido key={pedido.id} pedido={pedido} disenadorId={usuario?.id ?? ''} />
      ))}
    </div>
  );
}
