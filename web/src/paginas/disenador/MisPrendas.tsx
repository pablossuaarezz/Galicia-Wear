// Mis prendas (diseñador): catálogo propio (incluye retiradas) con acciones de publicar/retirar,
// editar y eliminar (baja lógica). Enlaza al alta de nuevas prendas.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Leaf, Pencil, Plus, Trash2 } from 'lucide-react';
import { Boton, EnlaceBoton, EstadoVacio, Esqueleto, Insignia, Modal, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { usarMisPrendas } from '@/hooks/usarPanelDisenador';
import { apiProductos } from '@/api/endpoints/productos';
import { usarTitulo } from '@/hooks/usarTitulo';
import { formatoPrecio } from '@/util/formatos';
import { resolverImagen } from '@/util/imagenes';
import { MATERIALES } from '@/util/constantes';
import { mensajeDeError } from '@/util/validacion';
import type { ProductoResumen } from '@/api/tipos';

export default function MisPrendas() {
  usarTitulo('Mis prendas');
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const { data, isLoading } = usarMisPrendas();
  const prendas = data?.datos ?? [];
  const [aEliminar, setAEliminar] = useState<ProductoResumen | null>(null);

  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['misPrendas'] });
  }

  const cambiarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      apiProductos.actualizar(id, { activo }),
    onSuccess: (_d, variables) => {
      invalidar();
      brindis.exito(variables.activo ? 'Prenda publicada' : 'Prenda retirada');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => apiProductos.eliminar(id),
    onSuccess: () => {
      invalidar();
      setAEliminar(null);
      brindis.info('Prenda retirada del catálogo');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-tinta-900">Mis prendas</h2>
        <EnlaceBoton to="/panel/prendas/nueva" tamano="sm" iconoIzquierda={<Plus className="h-4 w-4" />}>
          Nueva prenda
        </EnlaceBoton>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, indice) => (
            <Esqueleto key={indice} className="h-24 rounded-xl2" />
          ))}
        </div>
      ) : prendas.length === 0 ? (
        <EstadoVacio
          icono={<Leaf className="h-6 w-6" />}
          titulo="Aún no tienes prendas"
          descripcion="Crea tu primera prenda, añádele variantes y fotos, y publícala en el catálogo."
          accion={<EnlaceBoton to="/panel/prendas/nueva">Crear prenda</EnlaceBoton>}
        />
      ) : (
        <div className="space-y-3">
          {prendas.map((prenda) => {
            const imagen = prenda.imagenes[0];
            return (
              <Tarjeta key={prenda.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                  {imagen?.url ? (
                    <img src={resolverImagen(imagen.url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-atlantic-300">
                      <Leaf className="h-5 w-5" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-semibold text-tinta-900">{prenda.nombre}</p>
                    {prenda.activo ? (
                      <Insignia tono="galego">Publicada</Insignia>
                    ) : (
                      <Insignia tono="neutro">Retirada</Insignia>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-tinta-400">
                    {MATERIALES[prenda.materialPrincipal]} · {formatoPrecio(prenda.precioBase)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => cambiarEstado.mutate({ id: prenda.id, activo: !prenda.activo })}
                    iconoIzquierda={prenda.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  >
                    {prenda.activo ? 'Retirar' : 'Publicar'}
                  </Boton>
                  <Link
                    to={`/panel/prendas/${prenda.id}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-tinta-500 transition-colors hover:bg-atlantic-50 hover:text-atlantic-700"
                    aria-label={`Editar ${prenda.nombre}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAEliminar(prenda)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-tinta-500 transition-colors hover:bg-peligro-suave hover:text-peligro-fuerte"
                    aria-label={`Eliminar ${prenda.nombre}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      <Modal
        abierto={Boolean(aEliminar)}
        alCerrar={() => setAEliminar(null)}
        titulo="Eliminar prenda"
        descripcion="La prenda se retirará del catálogo (baja lógica). Los pedidos anteriores no se ven afectados."
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAEliminar(null)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={eliminar.isPending} onClick={() => aEliminar && eliminar.mutate(aEliminar.id)}>
              Eliminar
            </Boton>
          </>
        }
      >
        <p className="text-sm text-tinta-500">¿Eliminar «{aEliminar?.nombre}»?</p>
      </Modal>
    </div>
  );
}
