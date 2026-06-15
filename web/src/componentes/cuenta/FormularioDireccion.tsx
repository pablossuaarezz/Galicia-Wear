// Formulario reutilizable de dirección (alta y edición), usado en el checkout y en
// "Mis direcciones". Valida en cliente reflejando las reglas del backend.
import { useState, type FormEvent } from 'react';
import { Boton, Campo } from '@/componentes/ui';
import { validarCodigoPostal, validarObligatorio } from '@/util/validacion';
import type { Direccion, EntradaDireccion } from '@/api/tipos';

interface PropsFormulario {
  /** Dirección existente a editar; si no se proporciona, el formulario arranca vacío (alta). */
  inicial?: Direccion;
  /** Texto del botón de envío (permite personalizarlo según el contexto, p. ej. "Crear"/"Guardar"). */
  textoBoton?: string;
  /** Indica si el envío está en curso, para mostrar el spinner en el botón. */
  enviando?: boolean;
  /** Callback al guardar; recibe los datos ya validados y listos para enviar a la API. */
  alGuardar: (datos: EntradaDireccion) => void | Promise<void>;
  /** Callback opcional para cancelar la edición/alta (muestra un botón "Cancelar"). */
  alCancelar?: () => void;
}

/**
 * Formulario de alta o edición de una dirección de envío.
 *
 * Mantiene su propio estado de campos y errores de validación. Las reglas de validación
 * replican (en cliente) las del backend, para dar feedback inmediato antes de hacer la
 * petición. Si `inicial` está definido, los campos se rellenan con sus valores (modo edición);
 * en caso contrario arranca vacío con la provincia por defecto "A Coruña" (modo alta).
 *
 * @param inicial - Dirección a editar (opcional).
 * @param textoBoton - Texto del botón de envío.
 * @param enviando - Si `true`, deshabilita visualmente el botón mostrando un spinner.
 * @param alGuardar - Callback invocado con los datos validados al enviar el formulario.
 * @param alCancelar - Callback invocado al pulsar "Cancelar".
 * @returns Formulario controlado con campos de alias, dirección, código postal, ciudad y provincia.
 */
export function FormularioDireccion({
  inicial,
  textoBoton = 'Guardar dirección',
  enviando = false,
  alGuardar,
  alCancelar,
}: PropsFormulario) {
  // Estado inicial de los campos: si hay una dirección existente (`inicial`), se precarga;
  // si no, se arranca con valores vacíos y provincia por defecto "A Coruña".
  const [valores, setValores] = useState<EntradaDireccion>({
    alias: inicial?.alias ?? '',
    linea1: inicial?.linea1 ?? '',
    linea2: inicial?.linea2 ?? '',
    ciudad: inicial?.ciudad ?? '',
    codigoPostal: inicial?.codigoPostal ?? '',
    provincia: inicial?.provincia ?? 'A Coruña',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  function cambiar(campo: keyof EntradaDireccion, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: Record<string, string> = {};
    const errorAlias = validarObligatorio(valores.alias, 'El alias');
    if (errorAlias) nuevos.alias = errorAlias;
    if (valores.linea1.trim().length < 5) nuevos.linea1 = 'La dirección es demasiado corta';
    if (valores.ciudad.trim().length < 2) nuevos.ciudad = 'Indica la ciudad';
    const errorCp = validarCodigoPostal(valores.codigoPostal);
    if (errorCp) nuevos.codigoPostal = errorCp;
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }
    setErrores({});
    void alGuardar({
      ...valores,
      linea2: valores.linea2?.trim() || undefined,
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        etiqueta="Alias"
        placeholder="Casa, trabajo…"
        required
        value={valores.alias}
        error={errores.alias}
        onChange={(e) => cambiar('alias', e.target.value)}
      />
      <Campo
        etiqueta="Dirección"
        placeholder="Calle, número, piso"
        required
        value={valores.linea1}
        error={errores.linea1}
        onChange={(e) => cambiar('linea1', e.target.value)}
      />
      <Campo
        etiqueta="Detalles (opcional)"
        placeholder="Portal, escalera, referencia…"
        value={valores.linea2 ?? ''}
        onChange={(e) => cambiar('linea2', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Campo
          etiqueta="Código postal"
          inputMode="numeric"
          required
          value={valores.codigoPostal}
          error={errores.codigoPostal}
          onChange={(e) => cambiar('codigoPostal', e.target.value)}
        />
        <Campo
          etiqueta="Ciudad"
          required
          value={valores.ciudad}
          error={errores.ciudad}
          onChange={(e) => cambiar('ciudad', e.target.value)}
        />
      </div>
      <Campo
        etiqueta="Provincia"
        value={valores.provincia ?? ''}
        onChange={(e) => cambiar('provincia', e.target.value)}
      />

      <div className="flex justify-end gap-3 pt-2">
        {alCancelar && (
          <Boton type="button" variante="secundario" onClick={alCancelar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" cargando={enviando}>
          {textoBoton}
        </Boton>
      </div>
    </form>
  );
}
