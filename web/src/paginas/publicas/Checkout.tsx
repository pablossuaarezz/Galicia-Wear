// Checkout: elegir dirección (o crear una), método de pago y confirmar. Crea el pedido
// (POST /pedidos) y simula el pago (PATCH /pedidos/:id/pagar, stub), mostrando la confirmación
// con el número GW-AAAA-NNNNN.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, MapPin, PartyPopper, Plus } from 'lucide-react';
import { Boton, EnlaceBoton, EstadoVacio, Modal, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { ContenedorPagina } from '@/componentes/disposicion/ContenedorPagina';
import { EncabezadoPagina } from '@/componentes/disposicion/EncabezadoPagina';
import { FormularioDireccion } from '@/componentes/cuenta/FormularioDireccion';
import { usarCarrito } from '@/contexto/ContextoCarrito';
import { usarDirecciones } from '@/hooks/usarCuenta';
import { apiDirecciones } from '@/api/endpoints/direcciones';
import { apiPedidos } from '@/api/endpoints/pedidos';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoPrecio } from '@/util/formatos';
import { CODIGOS_METODO_PAGO, METODOS_PAGO } from '@/util/constantes';
import { mensajeDeError } from '@/util/validacion';
import { cx } from '@/util/cx';
import type { EntradaDireccion, MetodoPago, Pedido } from '@/api/tipos';

export default function Checkout() {
  usarTitulo('Finalizar compra');
  const brindis = usarBrindis();
  const clienteConsultas = useQueryClient();
  const { items, resumen, estaVacio, cargando } = usarCarrito();
  const consultaDirecciones = usarDirecciones();
  const direcciones = useMemo(() => consultaDirecciones.data ?? [], [consultaDirecciones.data]);

  const [direccionId, setDireccionId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('TARJETA');
  const [notas, setNotas] = useState('');
  const [modalDireccion, setModalDireccion] = useState(false);
  const [pedidoCompletado, setPedidoCompletado] = useState<Pedido | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Selecciona por defecto la dirección principal (o la primera).
  useEffect(() => {
    if (direccionId === null && direcciones.length > 0) {
      const principal = direcciones.find((d) => d.esPrincipal) ?? direcciones[0];
      setDireccionId(principal.id);
    }
  }, [direcciones, direccionId]);

  const crearDireccion = useMutation({
    mutationFn: (datos: EntradaDireccion) => apiDirecciones.crear(datos),
    onSuccess: (direccion) => {
      clienteConsultas.invalidateQueries({ queryKey: ['direcciones'] });
      setDireccionId(direccion.id);
      setModalDireccion(false);
      brindis.exito('Dirección añadida');
    },
    onError: (error) => brindis.error(mensajeDeError(error)),
  });

  async function confirmar() {
    if (!direccionId) {
      brindis.error('Elige una dirección de envío');
      return;
    }
    setProcesando(true);
    try {
      const pedido = await apiPedidos.crear({
        direccionEnvioId: direccionId,
        metodoPago,
        notas: notas.trim() || undefined,
      });
      const pagado = await apiPedidos.pagar(pedido.id);
      clienteConsultas.invalidateQueries({ queryKey: ['carrito'] });
      clienteConsultas.invalidateQueries({ queryKey: ['pedidos'] });
      setPedidoCompletado(pagado);
    } catch (error) {
      brindis.error(mensajeDeError(error, 'No se pudo completar el pedido'));
    } finally {
      setProcesando(false);
    }
  }

  // Pantalla de confirmación
  if (pedidoCompletado) {
    return (
      <ContenedorPagina ancho="estrecho" className="py-16">
        <Tarjeta className="p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-galego-50 text-galego-600">
            <PartyPopper className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="font-editorial text-3xl font-semibold text-tinta-900">¡Pedido confirmado!</h1>
          <p className="mt-2 text-tinta-500">
            Gracias por apostar por la moda gallega sostenible. Hemos avisado a los diseñadores.
          </p>
          <p className="mt-6 inline-block rounded-full bg-atlantic-50 px-4 py-1.5 font-display text-sm font-bold tracking-wide text-atlantic-700">
            {pedidoCompletado.numeroPedido}
          </p>
          <p className="mt-4 font-display text-2xl font-bold text-tinta-900">
            {formatoPrecio(pedidoCompletado.total)}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <EnlaceBoton to={`/cuenta/pedidos/${pedidoCompletado.id}`}>Ver mi pedido</EnlaceBoton>
            <EnlaceBoton to="/catalogo" variante="secundario">
              Seguir comprando
            </EnlaceBoton>
          </div>
        </Tarjeta>
      </ContenedorPagina>
    );
  }

  if (!cargando && estaVacio) {
    return (
      <ContenedorPagina className="py-12">
        <EncabezadoPagina antetitulo="Compra" titulo="Finalizar compra" />
        <div className="mt-8">
          <EstadoVacio
            titulo="No hay nada que tramitar"
            descripcion="Tu carrito está vacío."
            accion={<EnlaceBoton to="/catalogo">Ir al catálogo</EnlaceBoton>}
          />
        </div>
      </ContenedorPagina>
    );
  }

  return (
    <ContenedorPagina ancho="ancho" className="py-10">
      <EncabezadoPagina antetitulo="Último paso" titulo="Finalizar compra" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Dirección de envío */}
          <Tarjeta className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
                <MapPin className="h-5 w-5 text-atlantic-500" aria-hidden />
                Dirección de envío
              </h2>
              <Boton
                variante="fantasma"
                tamano="sm"
                iconoIzquierda={<Plus className="h-4 w-4" />}
                onClick={() => setModalDireccion(true)}
              >
                Nueva
              </Boton>
            </div>

            {direcciones.length === 0 ? (
              <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-tinta-500">
                Aún no tienes direcciones. Añade una para continuar.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {direcciones.map((direccion) => (
                  <button
                    key={direccion.id}
                    type="button"
                    onClick={() => setDireccionId(direccion.id)}
                    className={cx(
                      'rounded-xl border p-4 text-left transition-all',
                      direccion.id === direccionId
                        ? 'border-atlantic-500 bg-atlantic-50 ring-1 ring-atlantic-500/30'
                        : 'border-piedra-200 bg-white hover:border-atlantic-300',
                    )}
                  >
                    <p className="text-sm font-semibold text-tinta-800">{direccion.alias}</p>
                    <p className="mt-1 text-xs leading-relaxed text-tinta-500">
                      {direccion.linea1}
                      {direccion.linea2 ? `, ${direccion.linea2}` : ''}
                      <br />
                      {direccion.codigoPostal} {direccion.ciudad}, {direccion.provincia}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Tarjeta>

          {/* Método de pago */}
          <Tarjeta className="p-6">
            <h2 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-semibold text-tinta-900">
              <CreditCard className="h-5 w-5 text-atlantic-500" aria-hidden />
              Método de pago
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {CODIGOS_METODO_PAGO.map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setMetodoPago(metodo)}
                  className={cx(
                    'rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    metodo === metodoPago
                      ? 'border-atlantic-500 bg-atlantic-50 text-atlantic-700 ring-1 ring-atlantic-500/30'
                      : 'border-piedra-200 bg-white text-tinta-700 hover:border-atlantic-300',
                  )}
                >
                  {METODOS_PAGO[metodo]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-tinta-400">
              El pago es una simulación (TFG): no se realiza ningún cargo real.
            </p>
          </Tarjeta>

          {/* Notas */}
          <Tarjeta className="p-6">
            <label htmlFor="notas-pedido" className="mb-2 block font-display text-sm font-semibold text-tinta-800">
              Notas para el pedido (opcional)
            </label>
            <textarea
              id="notas-pedido"
              rows={3}
              maxLength={500}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Indicaciones de entrega, preferencias…"
              className="w-full resize-y rounded-xl border border-piedra-200 bg-white px-3.5 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-300 focus:border-atlantic-400 focus:outline-none focus:ring-2 focus:ring-atlantic-500/30"
            />
          </Tarjeta>
        </div>

        {/* Resumen */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Tarjeta className="p-6">
            <h2 className="font-display text-lg font-semibold text-tinta-900">Tu pedido</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-tinta-600">
                    {item.cantidad}× {item.variante.producto.nombre}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2.5 border-t border-piedra-100 pt-4 text-sm">
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
                <dd className="font-display font-bold tabular-nums text-tinta-900">{formatoPrecio(resumen.total)}</dd>
              </div>
            </dl>

            <Boton
              ancho
              tamano="lg"
              className="mt-6"
              onClick={confirmar}
              cargando={procesando}
              disabled={!direccionId || estaVacio}
              iconoIzquierda={<CheckCircle2 className="h-5 w-5" />}
            >
              Confirmar y pagar
            </Boton>
            <Link to="/carrito" className="mt-3 block text-center text-sm font-medium text-atlantic-700 hover:underline">
              Volver al carrito
            </Link>
          </Tarjeta>
        </aside>
      </div>

      <Modal abierto={modalDireccion} alCerrar={() => setModalDireccion(false)} titulo="Nueva dirección">
        <FormularioDireccion
          enviando={crearDireccion.isPending}
          alGuardar={(datos) => crearDireccion.mutate(datos)}
          alCancelar={() => setModalDireccion(false)}
          textoBoton="Añadir dirección"
        />
      </Modal>
    </ContenedorPagina>
  );
}
