// Mis direcciones: alta, edición, borrado y marcado de dirección principal.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Boton, EstadoVacio, Esqueleto, Insignia, Modal, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { FormularioDireccion } from '@/componentes/cuenta/FormularioDireccion';
import { usarDirecciones } from '@/hooks/usarCuenta';
import { apiDirecciones } from '@/api/endpoints/direcciones';
import { usarTitulo } from '@/hooks/usarTitulo';
import { mensajeDeError } from '@/util/validacion';
import type { Direccion, EntradaDireccion } from '@/api/tipos';

export default function MisDirecciones() {
  usarTitulo('Mis direcciones');
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const { data: direcciones = [], isLoading } = usarDirecciones();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Direccion | null>(null);
  const [aEliminar, setAEliminar] = useState<Direccion | null>(null);

  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['direcciones'] });
  }

  const guardar = useMutation({
    mutationFn: (datos: EntradaDireccion) =>
      editando ? apiDirecciones.actualizar(editando.id, datos) : apiDirecciones.crear(datos),
    onSuccess: () => {
      invalidar();
      setModalAbierto(false);
      setEditando(null);
      brindis.exito('Dirección guardada');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => apiDirecciones.eliminar(id),
    onSuccess: () => {
      invalidar();
      setAEliminar(null);
      brindis.info('Dirección eliminada');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const marcarPrincipal = useMutation({
    mutationFn: (id: string) => apiDirecciones.marcarPrincipal(id),
    onSuccess: () => {
      invalidar();
      brindis.exito('Dirección principal actualizada');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function abrirNueva() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(direccion: Direccion) {
    setEditando(direccion);
    setModalAbierto(true);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-tinta-900">Mis direcciones</h2>
        <Boton tamano="sm" iconoIzquierda={<Plus className="h-4 w-4" />} onClick={abrirNueva}>
          Añadir
        </Boton>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Esqueleto className="h-36 rounded-xl2" />
          <Esqueleto className="h-36 rounded-xl2" />
        </div>
      ) : direcciones.length === 0 ? (
        <EstadoVacio
          icono={<MapPin className="h-6 w-6" />}
          titulo="No tienes direcciones guardadas"
          descripcion="Añade una dirección para agilizar tus próximos pedidos."
          accion={<Boton onClick={abrirNueva}>Añadir dirección</Boton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {direcciones.map((direccion) => (
            <Tarjeta key={direccion.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-tinta-900">
                  <Home className="h-4 w-4 text-atlantic-500" aria-hidden />
                  {direccion.alias}
                </span>
                {direccion.esPrincipal && (
                  <Insignia tono="galego" className="gap-1">
                    <Star className="h-3 w-3" aria-hidden />
                    Principal
                  </Insignia>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-tinta-500">
                {direccion.linea1}
                {direccion.linea2 ? `, ${direccion.linea2}` : ''}
                <br />
                {direccion.codigoPostal} {direccion.ciudad}, {direccion.provincia}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-piedra-100 pt-3">
                {!direccion.esPrincipal && (
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => marcarPrincipal.mutate(direccion.id)}
                    iconoIzquierda={<Star className="h-3.5 w-3.5" />}
                  >
                    Hacer principal
                  </Boton>
                )}
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  onClick={() => abrirEdicion(direccion)}
                  iconoIzquierda={<Pencil className="h-3.5 w-3.5" />}
                >
                  Editar
                </Boton>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  className="text-peligro-fuerte hover:bg-peligro-suave"
                  onClick={() => setAEliminar(direccion)}
                  iconoIzquierda={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Eliminar
                </Boton>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={editando ? 'Editar dirección' : 'Nueva dirección'}
      >
        <FormularioDireccion
          inicial={editando ?? undefined}
          enviando={guardar.isPending}
          alGuardar={(datos) => guardar.mutate(datos)}
          alCancelar={() => setModalAbierto(false)}
          textoBoton={editando ? 'Guardar cambios' : 'Añadir dirección'}
        />
      </Modal>

      <Modal
        abierto={Boolean(aEliminar)}
        alCerrar={() => setAEliminar(null)}
        titulo="Eliminar dirección"
        descripcion={`¿Seguro que quieres eliminar "${aEliminar?.alias}"? Esta acción no se puede deshacer.`}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAEliminar(null)}>
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              cargando={eliminar.isPending}
              onClick={() => aEliminar && eliminar.mutate(aEliminar.id)}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        <p className="text-sm text-tinta-500">La dirección dejará de estar disponible en el checkout.</p>
      </Modal>
    </div>
  );
}
