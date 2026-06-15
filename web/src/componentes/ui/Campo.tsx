// Controles de formulario accesibles (input, textarea, select) con etiqueta, ayuda y error
// inline enlazados por aria-describedby/aria-invalid. Comparten estilo y comportamiento.
//
// Este archivo agrupa los tres controles de entrada del sistema de diseño: Campo (input de
// texto), CampoArea (textarea) y Selector (select). Todos comparten un mismo envoltorio que
// pinta la etiqueta, el texto de ayuda y el mensaje de error, y la misma función de estilos
// que reacciona al estado de error. La accesibilidad se garantiza enlazando el control con su
// etiqueta (htmlFor/id) y con sus textos auxiliares (aria-describedby) y marcando aria-invalid.
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '@/util/cx';

// Clases base compartidas por todos los controles: ancho completo, borde redondeado, tipografía,
// anillo de foco azul atlántico y estilos de estado deshabilitado.
const BASE_CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-300 ' +
  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-atlantic-500/40 ' +
  'disabled:cursor-not-allowed disabled:bg-piedra-50';

/**
 * Devuelve las clases del control combinando las base con las de estado:
 * borde y anillo rojos (peligro) cuando hay error, o borde neutro/azul cuando es válido.
 *
 * @param hayError Indica si el control debe mostrar el estilo de error.
 * @returns Cadena de clases CSS aplicables al control.
 */
function clasesControl(hayError: boolean): string {
  return cx(
    BASE_CONTROL,
    hayError
      ? 'border-peligro focus:border-peligro focus:ring-peligro/30'
      : 'border-piedra-200 focus:border-atlantic-400',
  );
}

/**
 * Props del componente interno {@link Envoltorio}, que estructura visualmente cualquier control.
 */
interface EnvoltorioProps {
  /** Identificador del control asociado, usado en el atributo htmlFor de la etiqueta. */
  id: string;
  /** Texto de la etiqueta del campo; si se omite, no se renderiza etiqueta. */
  etiqueta?: string;
  /** Texto de ayuda mostrado bajo el control cuando no hay error. */
  ayuda?: string;
  /** Mensaje de error; cuando está presente tiene prioridad sobre la ayuda y aplica estilo de error. */
  error?: string;
  /** Si es true, añade un asterisco a la etiqueta para indicar que el campo es obligatorio. */
  requerido?: boolean;
  /** El control de formulario propiamente dicho (input, textarea o select). */
  children: ReactNode;
}

/**
 * Envoltorio interno reutilizable que dispone la etiqueta, el control y el texto auxiliar
 * (ayuda o error) en una columna. El mensaje de error y el de ayuda comparten posición:
 * si hay error se muestra el error, en caso contrario la ayuda.
 */
function Envoltorio({ id, etiqueta, ayuda, error, requerido, children }: EnvoltorioProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Etiqueta enlazada al control por htmlFor; el asterisco solo aparece si es requerido. */}
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-tinta-700">
          {etiqueta}
          {requerido && <span className="ml-0.5 text-peligro">*</span>}
        </label>
      )}
      {children}
      {/* El error (id `${id}-error`) tiene prioridad; si no lo hay, se muestra la ayuda
          (id `${id}-ayuda`). Ambos ids se referencian desde aria-describedby del control. */}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-peligro-fuerte">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="text-xs text-tinta-400">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

/**
 * Props del componente {@link Campo}: extiende los atributos nativos de <input> con etiqueta,
 * texto de ayuda y mensaje de error opcionales.
 */
interface PropsCampo extends InputHTMLAttributes<HTMLInputElement> {
  /** Texto de la etiqueta del campo. */
  etiqueta?: string;
  /** Texto de ayuda mostrado bajo el campo cuando no hay error. */
  ayuda?: string;
  /** Mensaje de error a mostrar; activa el estilo y los atributos ARIA de error. */
  error?: string;
}

/**
 * Campo de entrada de texto (input) accesible del sistema de diseño.
 *
 * Genera automáticamente un identificador si no se proporciona, enlaza la etiqueta y los
 * textos auxiliares mediante atributos ARIA y aplica el estilo de error cuando procede.
 * Usa `forwardRef` para exponer el elemento <input> al componente padre.
 */
export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etiqueta, ayuda, error, id, className, required, ...resto },
  ref,
) {
  // Se genera un id estable; si el consumidor pasa uno propio, prevalece el suyo.
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <Envoltorio id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <input
        ref={ref}
        id={idCampo}
        required={required}
        // aria-invalid marca el control como inválido para tecnologías de asistencia.
        aria-invalid={error ? true : undefined}
        // aria-describedby apunta al mensaje de error o, en su ausencia, al texto de ayuda.
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cx(clasesControl(Boolean(error)), className)}
        {...resto}
      />
    </Envoltorio>
  );
});

interface PropsArea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  ayuda?: string;
  error?: string;
}

export const CampoArea = forwardRef<HTMLTextAreaElement, PropsArea>(function CampoArea(
  { etiqueta, ayuda, error, id, className, required, rows = 4, ...resto },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <Envoltorio id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <textarea
        ref={ref}
        id={idCampo}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cx(clasesControl(Boolean(error)), 'resize-y', className)}
        {...resto}
      />
    </Envoltorio>
  );
});

interface PropsSelector extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
  ayuda?: string;
  error?: string;
}

export const Selector = forwardRef<HTMLSelectElement, PropsSelector>(function Selector(
  { etiqueta, ayuda, error, id, className, required, children, ...resto },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <Envoltorio id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <select
        ref={ref}
        id={idCampo}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cx(clasesControl(Boolean(error)), 'cursor-pointer appearance-none pr-9', className)}
        {...resto}
      >
        {children}
      </select>
    </Envoltorio>
  );
});
