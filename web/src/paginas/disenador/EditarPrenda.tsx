// Alta y edición de prenda (panel del diseñador). Página dividida en tres secciones:
//  - FormularioDatos: nombre, descripción, precio, km de origen y material principal.
//  - SeccionVariantes: combinaciones de talla·color con su SKU, stock y ajuste de precio.
//  - SeccionImagenes: subida (clic o arrastrar y soltar) de fotos como data URI base64.
// En el alta solo se piden los datos básicos; al crear la prenda se navega al modo edición
// (misma página con `id` en la ruta), donde recién entonces se habilitan variantes e imágenes,
// ya que estas necesitan el identificador del producto recién creado.
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Star, Trash2, UploadCloud } from 'lucide-react';
import { Boton, Campo, CampoArea, Esqueleto, Insignia, Selector, Spinner, Tarjeta } from '@/componentes/ui';
import { usarBrindis } from '@/componentes/ui/Brindis';
import { usarPrendaMia } from '@/hooks/usarPanelDisenador';
import { apiProductos } from '@/api/endpoints/productos';
import { apiVariantes } from '@/api/endpoints/variantes';
import { apiImagenes } from '@/api/endpoints/imagenes';
import { usarTitulo } from '@/hooks/usarTitulo';
import { cx } from '@/util/cx';
import { archivoADataUri, resolverImagen } from '@/util/imagenes';
import { mensajeDeError } from '@/util/validacion';
import { CODIGOS_MATERIAL, CODIGOS_TALLA, MATERIALES, TALLAS } from '@/util/constantes';
import type {
  EntradaProducto,
  EntradaVariante,
  MaterialPrincipal,
  ProductoDetalle,
  TallaPrenda,
} from '@/api/tipos';

// ---- Formulario de datos de la prenda ----

/**
 * Formulario con los datos básicos de la prenda (nombre, descripción, precio, km de origen y
 * material principal).
 *
 * Funciona en dos modos según la prop `esEdicion`:
 * - Alta: al guardar llama a la mutación `crear`; tras crearse navega al modo edición.
 * - Edición: precarga los valores de `inicial` y al guardar llama a la mutación `actualizar`.
 *
 * Valida los campos en cliente con `validar()` antes de enviar.
 *
 * @param inicial   Detalle de la prenda existente (solo en modo edición); precarga el formulario.
 * @param esEdicion Indica si se está editando una prenda existente o creando una nueva.
 */
function FormularioDatos({
  inicial,
  esEdicion,
}: {
  inicial?: ProductoDetalle;
  esEdicion: boolean;
}) {
  const navegar = useNavigate();
  const brindis = usarBrindis();
  const clienteConsultas = useQueryClient();

  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [precio, setPrecio] = useState(inicial ? String(inicial.precioBase) : '');
  const [kmOrigen, setKmOrigen] = useState(inicial ? String(inicial.kmOrigen) : '0');
  const [material, setMaterial] = useState<MaterialPrincipal>(inicial?.materialPrincipal ?? 'ALGODON_ORGANICO');
  const [errores, setErrores] = useState<Record<string, string>>({});

  function validar(): EntradaProducto | null {
    const nuevos: Record<string, string> = {};
    if (nombre.trim().length < 3) nuevos.nombre = 'Mínimo 3 caracteres';
    if (descripcion.trim().length < 20) nuevos.descripcion = 'Describe la prenda (mínimo 20 caracteres)';
    const precioNum = Number(precio);
    if (!precioNum || precioNum <= 0) nuevos.precio = 'Indica un precio válido';
    const kmNum = Number(kmOrigen);
    if (!Number.isInteger(kmNum) || kmNum < 0) nuevos.kmOrigen = 'Distancia no válida';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return null;
    return {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precioBase: precioNum,
      kmOrigen: kmNum,
      materialPrincipal: material,
    };
  }

  const crear = useMutation({
    mutationFn: (datos: EntradaProducto) => apiProductos.crear(datos),
    onSuccess: (producto) => {
      clienteConsultas.invalidateQueries({ queryKey: ['misPrendas'] });
      brindis.exito('Prenda creada. Añade variantes e imágenes.');
      navegar(`/panel/prendas/${producto.id}`, { replace: true });
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const actualizar = useMutation({
    mutationFn: (datos: EntradaProducto) => apiProductos.actualizar(inicial!.id, datos),
    onSuccess: () => {
      clienteConsultas.invalidateQueries({ queryKey: ['prendaMia', inicial!.id] });
      clienteConsultas.invalidateQueries({ queryKey: ['misPrendas'] });
      brindis.exito('Cambios guardados');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const datos = validar();
    if (!datos) return;
    if (esEdicion) actualizar.mutate(datos);
    else crear.mutate(datos);
  }

  return (
    <Tarjeta className="p-6">
      <h2 className="font-display text-lg font-semibold text-tinta-900">Datos de la prenda</h2>
      <form onSubmit={enviar} className="mt-5 space-y-5">
        <Campo
          etiqueta="Nombre"
          required
          value={nombre}
          error={errores.nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Jersey de lana reciclada"
        />
        <CampoArea
          etiqueta="Descripción"
          required
          rows={5}
          value={descripcion}
          error={errores.descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Materiales, confección, historia de la prenda…"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            etiqueta="Precio (€)"
            type="number"
            step="0.01"
            min="0"
            required
            value={precio}
            error={errores.precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <Campo
            etiqueta="Origen (km)"
            type="number"
            min="0"
            value={kmOrigen}
            error={errores.kmOrigen}
            onChange={(e) => setKmOrigen(e.target.value)}
          />
          <Selector
            etiqueta="Material"
            value={material}
            onChange={(e) => setMaterial(e.target.value as MaterialPrincipal)}
          >
            {CODIGOS_MATERIAL.map((codigo) => (
              <option key={codigo} value={codigo}>
                {MATERIALES[codigo]}
              </option>
            ))}
          </Selector>
        </div>
        <div className="flex justify-end">
          <Boton type="submit" cargando={crear.isPending || actualizar.isPending}>
            {esEdicion ? 'Guardar cambios' : 'Crear prenda'}
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}

// ---- Variantes ----

function SeccionVariantes({ producto }: { producto: ProductoDetalle }) {
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const [talla, setTalla] = useState<TallaPrenda>('M');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [ajuste, setAjuste] = useState('0');

  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['prendaMia', producto.id] });
  }

  const crear = useMutation({
    mutationFn: (datos: EntradaVariante) => apiVariantes.crear(producto.id, datos),
    onSuccess: () => {
      invalidar();
      setColor('');
      setSku('');
      setStock('0');
      setAjuste('0');
      brindis.exito('Variante añadida');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => apiVariantes.eliminar(producto.id, id),
    onSuccess: () => {
      invalidar();
      brindis.info('Variante eliminada');
    },
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  function anadir(evento: FormEvent) {
    evento.preventDefault();
    if (color.trim().length < 1 || sku.trim().length < 3) {
      brindis.error('Indica color y un SKU de al menos 3 caracteres');
      return;
    }
    crear.mutate({
      talla,
      color: color.trim(),
      sku: sku.trim().toUpperCase(),
      stock: Number(stock) || 0,
      ajustePrecio: Number(ajuste) || 0,
    });
  }

  return (
    <Tarjeta className="p-6">
      <h2 className="font-display text-lg font-semibold text-tinta-900">Variantes</h2>
      <p className="mt-1 text-sm text-tinta-500">Combinaciones de talla y color con su stock.</p>

      {producto.variantes.length > 0 && (
        <ul className="mt-4 divide-y divide-piedra-100">
          {producto.variantes.map((variante) => (
            <li key={variante.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="text-sm">
                <span className="font-medium text-tinta-800">
                  {TALLAS[variante.talla]} · {variante.color}
                </span>
                <span className="ml-2 text-xs text-tinta-400">
                  SKU {variante.sku} · stock {variante.stock}
                  {Number(variante.ajustePrecio) !== 0 ? ` · ${Number(variante.ajustePrecio) > 0 ? '+' : ''}${variante.ajustePrecio} €` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => eliminar.mutate(variante.id)}
                className="rounded-full p-2 text-tinta-400 transition-colors hover:bg-peligro-suave hover:text-peligro-fuerte"
                aria-label={`Eliminar variante ${variante.sku}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={anadir} className="mt-4 grid items-end gap-3 rounded-xl bg-sand-50 p-4 sm:grid-cols-[auto_1fr_1fr_auto_auto_auto]">
        <Selector etiqueta="Talla" value={talla} onChange={(e) => setTalla(e.target.value as TallaPrenda)}>
          {CODIGOS_TALLA.map((codigo) => (
            <option key={codigo} value={codigo}>
              {TALLAS[codigo]}
            </option>
          ))}
        </Selector>
        <Campo etiqueta="Color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Azul mar" />
        <Campo etiqueta="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="JER-AZUL-M" />
        <Campo etiqueta="Stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-20" />
        <Campo etiqueta="Ajuste €" type="number" step="0.01" value={ajuste} onChange={(e) => setAjuste(e.target.value)} className="w-24" />
        <Boton type="submit" cargando={crear.isPending} iconoIzquierda={<Plus className="h-4 w-4" />}>
          Añadir
        </Boton>
      </form>
    </Tarjeta>
  );
}

// ---- Imágenes ----

function SeccionImagenes({ producto }: { producto: ProductoDetalle }) {
  const clienteConsultas = useQueryClient();
  const brindis = usarBrindis();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  function invalidar() {
    clienteConsultas.invalidateQueries({ queryKey: ['prendaMia', producto.id] });
  }

  // Sube una o varias imágenes en serie (selector o arrastre). La primera es la principal solo
  // si la prenda aún no tenía ninguna. Ignora lo que no sea imagen.
  async function subirVarias(archivos: File[]) {
    const imagenes = archivos.filter((a) => a.type.startsWith('image/'));
    if (imagenes.length === 0) {
      if (archivos.length > 0) brindis.error('Solo se admiten archivos de imagen');
      return;
    }
    setSubiendo(true);
    let faltaPrincipal = producto.imagenes.length === 0;
    try {
      for (const archivo of imagenes) {
        const dataUri = await archivoADataUri(archivo, 1200, 0.82);
        await apiImagenes.crear(producto.id, {
          base64: dataUri,
          esPrincipal: faltaPrincipal,
          textoAlternativo: producto.nombre,
        });
        faltaPrincipal = false;
      }
      invalidar();
      brindis.exito(imagenes.length > 1 ? `${imagenes.length} imágenes añadidas` : 'Imagen añadida');
    } catch (error) {
      brindis.error(mensajeDeError(error, 'No se pudo subir la imagen'));
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  }

  function alArrastrarSobre(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    if (!subiendo) setArrastrando(true);
  }

  function alSalir(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    // Evita el parpadeo al pasar por elementos hijos: solo se apaga al salir del recuadro.
    if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setArrastrando(false);
  }

  function alSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastrando(false);
    if (subiendo) return;
    void subirVarias(Array.from(evento.dataTransfer.files));
  }

  const marcarPrincipal = useMutation({
    mutationFn: (id: string) => apiImagenes.marcarPrincipal(producto.id, id),
    onSuccess: invalidar,
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => apiImagenes.eliminar(producto.id, id),
    onSuccess: invalidar,
    onError: (e) => brindis.error(mensajeDeError(e)),
  });

  return (
    <Tarjeta className="p-6">
      <h2 className="font-display text-lg font-semibold text-tinta-900">Imágenes</h2>
      <p className="mt-1 text-sm text-tinta-500">
        Arrastra varias fotos o haz clic para subirlas. La primera será la principal.
      </p>

      {producto.imagenes.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {producto.imagenes.map((imagen) => (
            <div key={imagen.id} className="group relative overflow-hidden rounded-xl border border-piedra-100 bg-sand-100">
              <img src={resolverImagen(imagen.url)} alt={imagen.textoAlternativo ?? ''} className="aspect-square w-full object-cover" />
              {imagen.esPrincipal && (
                <Insignia tono="galego" className="absolute left-1.5 top-1.5 gap-1">
                  <Star className="h-3 w-3" aria-hidden />
                  Principal
                </Insignia>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-tinta-900/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!imagen.esPrincipal && (
                  <button
                    type="button"
                    onClick={() => marcarPrincipal.mutate(imagen.id)}
                    className="rounded-full bg-white/90 p-1.5 text-atlantic-700 hover:bg-white"
                    aria-label="Marcar como principal"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => eliminar.mutate(imagen.id)}
                  className="rounded-full bg-white/90 p-1.5 text-peligro-fuerte hover:bg-white"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona de arrastrar y soltar (también clic para seleccionar). */}
      <label
        onDragOver={alArrastrarSobre}
        onDragEnter={alArrastrarSobre}
        onDragLeave={alSalir}
        onDrop={alSoltar}
        className={cx(
          'mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed px-6 py-10 text-center transition-colors',
          arrastrando
            ? 'border-atlantic-500 bg-atlantic-50'
            : 'border-piedra-200 bg-sand-50 hover:border-atlantic-300 hover:bg-atlantic-50/50',
        )}
      >
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => subirVarias(Array.from(e.target.files ?? []))}
        />
        {subiendo ? (
          <>
            <Spinner tamano={24} className="text-atlantic-500" />
            <span className="text-sm font-medium text-tinta-600">Subiendo…</span>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-atlantic-100 text-atlantic-600">
              <UploadCloud className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-sm font-medium text-tinta-700">
              {arrastrando ? 'Suelta las fotos aquí' : 'Arrastra fotos aquí o haz clic para subir'}
            </span>
            <span className="text-xs text-tinta-400">JPG o PNG · varias a la vez · se reducen solas</span>
          </>
        )}
      </label>
    </Tarjeta>
  );
}

// ---- Página ----

export default function EditarPrenda() {
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);
  usarTitulo(esEdicion ? 'Editar prenda' : 'Nueva prenda');

  const consulta = usarPrendaMia(id);
  const producto = consulta.data;

  // Resetea el formulario al cambiar de prenda (clave por id).
  const [clave, setClave] = useState(id ?? 'nueva');
  useEffect(() => setClave(id ?? 'nueva'), [id]);

  if (esEdicion && consulta.isLoading) {
    return <Esqueleto className="h-96 rounded-xl2" />;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/panel/prendas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-atlantic-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Mis prendas
      </Link>

      <FormularioDatos key={clave} inicial={producto} esEdicion={esEdicion} />

      {esEdicion && producto ? (
        <>
          <SeccionVariantes producto={producto} />
          <SeccionImagenes producto={producto} />
        </>
      ) : (
        !esEdicion && (
          <p className="rounded-xl bg-atlantic-50 px-4 py-3 text-sm text-atlantic-700">
            Guarda la prenda para poder añadir sus variantes e imágenes.
          </p>
        )
      )}
    </div>
  );
}
