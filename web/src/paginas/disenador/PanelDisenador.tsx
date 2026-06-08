// Resumen del panel del diseñador: aviso de perfil de marca (si falta o está pendiente),
// KPIs sencillos (prendas, ventas, pendientes de aceptar) y accesos rápidos.
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Package, Plus, ShoppingBag, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EnlaceBoton, Esqueleto, Insignia, Tarjeta } from '@/componentes/ui';
import { usarMisPrendas, usarPerfilMarca } from '@/hooks/usarPanelDisenador';
import { usarPedidos } from '@/hooks/usarPedidos';
import { usarSesion } from '@/contexto/ContextoSesion';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoPrecio } from '@/util/formatos';

function TarjetaKpi({ Icono, etiqueta, valor }: { Icono: LucideIcon; etiqueta: string; valor: string }) {
  return (
    <Tarjeta className="p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlantic-50 text-atlantic-600">
        <Icono className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-tinta-900">{valor}</p>
      <p className="text-sm text-tinta-500">{etiqueta}</p>
    </Tarjeta>
  );
}

export default function PanelDisenador() {
  usarTitulo('Panel del diseñador');
  const { usuario } = usarSesion();
  const consultaMarca = usarPerfilMarca();
  const consultaPrendas = usarMisPrendas();
  const consultaPedidos = usarPedidos();

  const marca = consultaMarca.data;
  const sinMarca = consultaMarca.isError; // 404: aún no ha solicitado su perfil
  const prendas = consultaPrendas.data?.datos ?? [];
  const pedidos = consultaPedidos.data ?? [];

  const publicadas = prendas.filter((p) => p.activo).length;
  const ventas = formatoPrecio(
    pedidos
      .filter((p) => p.estado !== 'CANCELADO' && p.estado !== 'PENDIENTE_PAGO')
      .reduce((suma, p) => suma + Number(p.total), 0),
  );
  const pendientesAceptar = pedidos.filter(
    (p) => p.estado === 'PAGADO' && p.lineas.some((l) => l.estadoLinea === 'PAGADO'),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-tinta-900">
          Hola{marca ? `, ${marca.nombreMarca}` : usuario?.nombre ? `, ${usuario.nombre}` : ''} 👋
        </h2>
        <p className="text-sm text-tinta-500">Aquí tienes el pulso de tu tienda.</p>
      </div>

      {sinMarca ? (
        <Tarjeta className="flex flex-col gap-3 border-aviso/30 bg-aviso-suave p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-aviso-fuerte" aria-hidden />
            <div>
              <p className="font-display font-semibold text-aviso-fuerte">Completa tu perfil de marca</p>
              <p className="text-sm text-tinta-600">
                Para publicar prendas necesitas registrar tu marca (nombre, ciudad e IBAN).
              </p>
            </div>
          </div>
          <EnlaceBoton to="/panel/marca" variante="primario" className="shrink-0">
            Crear marca
          </EnlaceBoton>
        </Tarjeta>
      ) : (
        marca && !marca.validado && (
          <Tarjeta className="flex items-center gap-3 border-aviso/30 bg-aviso-suave p-5">
            <Clock className="h-5 w-5 shrink-0 text-aviso-fuerte" aria-hidden />
            <p className="text-sm text-tinta-700">
              Tu marca <strong>{marca.nombreMarca}</strong> está <Insignia tono="aviso">pendiente de validación</Insignia> por
              el equipo. Puedes preparar tus prendas mientras tanto.
            </p>
          </Tarjeta>
        )
      )}

      {consultaPrendas.isLoading || consultaPedidos.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <Esqueleto key={indice} className="h-28 rounded-xl2" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaKpi Icono={Package} etiqueta="Prendas publicadas" valor={String(publicadas)} />
          <TarjetaKpi Icono={Store} etiqueta="Prendas totales" valor={String(prendas.length)} />
          <TarjetaKpi Icono={ShoppingBag} etiqueta="Ventas (€)" valor={ventas} />
          <TarjetaKpi Icono={Clock} etiqueta="Por aceptar" valor={String(pendientesAceptar)} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <EnlaceBoton to="/panel/prendas/nueva" iconoIzquierda={<Plus className="h-4 w-4" />}>
          Nueva prenda
        </EnlaceBoton>
        <EnlaceBoton to="/panel/prendas" variante="secundario">
          Gestionar catálogo
        </EnlaceBoton>
        <EnlaceBoton to="/panel/pedidos" variante="secundario">
          Pedidos recibidos
        </EnlaceBoton>
      </div>
    </div>
  );
}
