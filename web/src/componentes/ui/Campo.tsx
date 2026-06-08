// Controles de formulario accesibles (input, textarea, select) con etiqueta, ayuda y error
// inline enlazados por aria-describedby/aria-invalid. Comparten estilo y comportamiento.
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '@/util/cx';

const BASE_CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-300 ' +
  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-atlantic-500/40 ' +
  'disabled:cursor-not-allowed disabled:bg-piedra-50';

function clasesControl(hayError: boolean): string {
  return cx(
    BASE_CONTROL,
    hayError
      ? 'border-peligro focus:border-peligro focus:ring-peligro/30'
      : 'border-piedra-200 focus:border-atlantic-400',
  );
}

interface EnvoltorioProps {
  id: string;
  etiqueta?: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  children: ReactNode;
}

function Envoltorio({ id, etiqueta, ayuda, error, requerido, children }: EnvoltorioProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-tinta-700">
          {etiqueta}
          {requerido && <span className="ml-0.5 text-peligro">*</span>}
        </label>
      )}
      {children}
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

interface PropsCampo extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  ayuda?: string;
  error?: string;
}

export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etiqueta, ayuda, error, id, className, required, ...resto },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <Envoltorio id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <input
        ref={ref}
        id={idCampo}
        required={required}
        aria-invalid={error ? true : undefined}
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
