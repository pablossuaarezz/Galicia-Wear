// Encabezado editorial de página/sección: antetítulo, título serif y descripción opcional.
//
// Componente de presentación reutilizable que da una cabecera tipográfica coherente a las
// páginas y secciones del storefront (lo usan, por ejemplo, `DisposicionCuenta` y
// `DisposicionPanel`, además de muchas páginas individuales). Opcionalmente muestra una zona de
// acciones a la derecha (botones, filtros) que se alinea con el título en pantallas grandes.
import type { ReactNode } from 'react';
import { cx } from '@/util/cx';

/**
 * Props del encabezado de página.
 */
interface PropsEncabezado {
  /** Título principal (se renderiza como `<h1>`). */
  titulo: string;
  /** Texto descriptivo opcional bajo el título. */
  descripcion?: string;
  /** Texto pequeño en mayúsculas mostrado sobre el título (categoría o sección). */
  antetitulo?: string;
  /** Contenido opcional alineado a la derecha (normalmente botones de acción). */
  acciones?: ReactNode;
  /** Clases Tailwind adicionales para el contenedor. */
  className?: string;
}

/**
 * Renderiza el bloque de encabezado de una página o sección.
 *
 * @param titulo - Título principal obligatorio.
 * @param descripcion - Descripción opcional.
 * @param antetitulo - Antetítulo opcional en mayúsculas.
 * @param acciones - Nodos de acción opcionales alineados a la derecha.
 * @param className - Clases adicionales para el contenedor.
 */
export function EncabezadoPagina({
  titulo,
  descripcion,
  antetitulo,
  acciones,
  className,
}: PropsEncabezado) {
  return (
    // En móvil se apila en columna; a partir de sm, título a la izquierda y acciones a la
    // derecha alineados por su base (`items-end`).
    <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {/* Antetítulo: solo se renderiza si se ha pasado la prop. */}
        {antetitulo && (
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-atlantic-600">
            {antetitulo}
          </p>
        )}
        <h1 className="mt-1 font-editorial text-3xl font-semibold leading-tight text-tinta-900 sm:text-4xl">
          {titulo}
        </h1>
        {/* Descripción opcional, con ancho máximo para no romper la legibilidad. */}
        {descripcion && <p className="mt-2 max-w-2xl text-tinta-500">{descripcion}</p>}
      </div>
      {/* Zona de acciones opcional; `shrink-0` evita que se comprima frente al título. */}
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
