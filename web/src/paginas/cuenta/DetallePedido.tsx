// Detalle de un pedido (cliente): líneas, dirección de envío, seguimiento y acciones (pagar el
// pedido pendiente o cancelarlo cuando aún es posible).
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Leaf, MapPin, Truck, XCircle } from 'lucide-react';
import { Boton, EnlaceBoton, Esqueleto, EstadoVacio, Modal, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { EstadoPedidoInsignia } from '@/componentes/pedidos/EstadoPedidoInsignia';
import { usarPedido } from '@/hooks/usarPedidos';
import { apiPedidos } from '@/api/endpoints/pedidos';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoFecha, formatoFechaHora, formatoPrecio } from '@/util/formatos';
import { TALLAS, TRANSPORTISTAS } from '@/util/constantes';
import { mensajeDeError } from '@/util/validacion';

export default function DetallePedido() {
  const { id } = useParams<{ id: string }>();
  const consulta = usarPedido(id);
  const pedido = consulta.data;
  usarTitulo(pedido ? `Pedido ${pedido.numeroPedido}` : 'Pedido');

  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);

  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['pedido', id] });
    clienteConsultas.invalidateQueries({ queryKey: ['pedidos'] });
  }

  const pagar = useMutation({
    mutationFn: () => apiPedidos.pagar(id!),
    onSuccess: () => {
      invalidar();
      brindis.exito('Pago confirmado');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const cancelar = useMutation({
    mutationFn: () => apiPedidos.cancelar(id!),
    onSuccess: () => {
      invalidar();
      setConfirmarCancelar(false);
      brindis.info('Pedido cancelado');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  if (consulta.isLoading) {
    return <Esqueleto className="h-96 rounded-xl2" />;
  }

  if (consulta.isError || !pedido) {
    return (
      <EstadoVacio
        titulo="Pedido no encontrado"
        descripcion="No pudimos cargar este pedido."
        accion={<EnlaceBoton to="/cuenta/pedidos">Volver a mis pedidos</EnlaceBoton>}
      />
    );
  }

  const cancelable = pedido.estado === 'PENDIENTE_PAGO' || pedido.estado === 'PAGADO';
  const envio = pedido.envio;

  return (
    <div>
      <Link
        to="/cuenta/pedidos"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-atlantic-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Mis pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-tinta-900">{pedido.numeroPedido}</h2>
          <p className="text-sm text-tinta-400">Realizado el {formatoFecha(pedido.fechaCreacion)}</p>
        </div>
        <EstadoPedidoInsignia estado={pedido.estado} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          {/* Líneas */}
          <Tarjeta className="p-6">
            <h3 className="font-display text-base font-semibold text-tinta-900">Artículos</h3>
            <ul className="mt-4 divide-y divide-piedra-100">
              {pedido.lineas.map((linea) => (
                <li key={linea.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/producto/${linea.variante.producto.slug}`}
                      className="font-medium text-tinta-800 hover:text-atlantic-700"
                    >
                      {linea.variante.producto.nombre}
                    </Link>
                    <p className="text-xs text-tinta-400">
                      {linea.disenador.nombreMarca} · {TALLAS[linea.variante.talla]} · {linea.variante.color} · ×
                      {linea.cantidad}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-tinta-900">
                    {formatoPrecio(Number(linea.precioUnitario) * linea.cantidad)}
                  </p>
                </li>
              ))}
            </ul>
          </Tarjeta>

          {/* Seguimiento del envío */}
          <Tarjeta className="p-6">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold text-tinta-900">
              <Truck className="h-5 w-5 text-atlantic-500" aria-hidden />
              Envío
            </h3>
            {envio ? (
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-tinta-500">Transportista</dt>
                  <dd className="font-medium text-tinta-800">{TRANSPORTISTAS[envio.transportista]}</dd>
                </div>
                {envio.envioEcologico && (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-galego-50 px-3 py-1 text-xs font-medium text-galego-700">
                    <Leaf className="h-3.5 w-3.5" aria-hidden />
                    Envío ecológico
                  </p>
                )}
                <div className="flex justify-between">
                  <dt className="text-tinta-500">Nº de seguimiento</dt>
                  <dd className="font-medium tabular-nums text-tinta-800">
                    {envio.numeroSeguimiento ?? 'Pendiente de asignar'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta-500">Entrega estimada</dt>
                  <dd className="font-medium text-tinta-800">{formatoFecha(envio.entregaEstimada)}</dd>
                </div>
                {envio.fechaEnvio && (
                  <div className="flex justify-between">
                    <dt className="text-tinta-500">Enviado</dt>
                    <dd className="font-medium text-tinta-800">{formatoFechaHora(envio.fechaEnvio)}</dd>
                  </div>
                )}
                {envio.fechaEntrega && (
                  <div className="flex justify-between">
                    <dt className="text-tinta-500">Entregado</dt>
                    <dd className="font-medium text-exito-fuerte">{formatoFechaHora(envio.fechaEntrega)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-tinta-500">
                El envío se preparará cuando el diseñador acepte tu pedido.
              </p>
            )}
          </Tarjeta>
        </div>

        {/* Resumen + acciones */}
        <aside className="space-y-6">
          <Tarjeta className="p-6">
            <h3 className="font-display text-base font-semibold text-tinta-900">Resumen</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-tinta-500">Subtotal</dt>
                <dd className="tabular-nums text-tinta-800">{formatoPrecio(pedido.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta-500">Envío</dt>
                <dd className="tabular-nums text-tinta-800">
                  {Number(pedido.costeEnvio) === 0 ? 'Gratis' : formatoPrecio(pedido.costeEnvio)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-piedra-100 pt-3 text-base">
                <dt className="font-semibold text-tinta-900">Total</dt>
                <dd className="font-display font-bold tabular-nums text-tinta-900">{formatoPrecio(pedido.total)}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              {pedido.estado === 'PENDIENTE_PAGO' && (
                <Boton
                  ancho
                  onClick={() => pagar.mutate()}
                  cargando={pagar.isPending}
                  iconoIzquierda={<CreditCard className="h-4 w-4" />}
                >
                  Pagar pedido
                </Boton>
              )}
              {cancelable && (
                <Boton
                  ancho
                  variante="secundario"
                  className="text-peligro-fuerte"
                  onClick={() => setConfirmarCancelar(true)}
                  iconoIzquierda={<XCircle className="h-4 w-4" />}
                >
                  Cancelar pedido
                </Boton>
              )}
            </div>
          </Tarjeta>

          <Tarjeta className="p-6">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold text-tinta-900">
              <MapPin className="h-5 w-5 text-atlantic-500" aria-hidden />
              Dirección de envío
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-tinta-500">
              <span className="font-medium text-tinta-700">{pedido.direccionEnvio.alias}</span>
              <br />
              {pedido.direccionEnvio.linea1}
              {pedido.direccionEnvio.linea2 ? `, ${pedido.direccionEnvio.linea2}` : ''}
              <br />
              {pedido.direccionEnvio.codigoPostal} {pedido.direccionEnvio.ciudad}, {pedido.direccionEnvio.provincia}
            </p>
          </Tarjeta>
        </aside>
      </div>

      <Modal
        abierto={confirmarCancelar}
        alCerrar={() => setConfirmarCancelar(false)}
        titulo="Cancelar pedido"
        descripcion="Se restaurará el stock y se avisará a los diseñadores. No se puede deshacer."
        pie={
          <>
            <Boton variante="secundario" onClick={() => setConfirmarCancelar(false)}>
              Volver
            </Boton>
            <Boton variante="peligro" cargando={cancelar.isPending} onClick={() => cancelar.mutate()}>
              Sí, cancelar
            </Boton>
          </>
        }
      >
        <p className="text-sm text-tinta-500">¿Seguro que quieres cancelar {pedido.numeroPedido}?</p>
      </Modal>
    </div>
  );
}
