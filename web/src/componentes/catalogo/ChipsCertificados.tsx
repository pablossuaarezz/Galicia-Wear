// Chips de certificados de sostenibilidad para filtrar el catálogo (selección única, alternable).
import { Leaf } from 'lucide-react';
import { Chip } from '@/componentes/ui';
import { CERTIFICADOS, CODIGOS_CERTIFICADO } from '@/util/constantes';
import type { CodigoCertificado } from '@/api/tipos';

interface PropsChipsCertificados {
  /** Código del certificado actualmente seleccionado (o `undefined` si ninguno). */
  seleccionado?: CodigoCertificado;
  /** Callback que recibe el nuevo código seleccionado, o `undefined` al deseleccionar. */
  alSeleccionar: (codigo: CodigoCertificado | undefined) => void;
}

/**
 * Renderiza un grupo de chips (uno por cada certificado de sostenibilidad existente) que
 * permiten filtrar el catálogo por un único certificado a la vez.
 *
 * Comportamiento de selección única alternable: al pulsar un chip ya activo se deselecciona
 * (pasa `undefined`); al pulsar uno distinto, se selecciona ese y se desactiva el anterior.
 *
 * @param seleccionado - Código del certificado activo, si lo hay.
 * @param alSeleccionar - Callback invocado con el código pulsado o `undefined` si se deselecciona.
 * @returns Lista de chips de certificados con icono de hoja (Leaf).
 */
export function ChipsCertificados({ seleccionado, alSeleccionar }: PropsChipsCertificados) {
  return (
    <div className="flex flex-wrap gap-2">
      {CODIGOS_CERTIFICADO.map((codigo) => {
        const activo = seleccionado === codigo;
        return (
          <Chip
            key={codigo}
            activo={activo}
            iconoIzquierda={<Leaf className="h-3.5 w-3.5" aria-hidden />}
            // Si el chip ya estaba activo, al pulsarlo se deselecciona (toggle).
            onClick={() => alSeleccionar(activo ? undefined : codigo)}
          >
            {CERTIFICADOS[codigo]}
          </Chip>
        );
      })}
    </div>
  );
}
