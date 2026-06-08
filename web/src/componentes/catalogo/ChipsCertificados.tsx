// Chips de certificados de sostenibilidad para filtrar el catálogo (selección única, alternable).
import { Leaf } from 'lucide-react';
import { Chip } from '@/componentes/ui';
import { CERTIFICADOS, CODIGOS_CERTIFICADO } from '@/util/constantes';
import type { CodigoCertificado } from '@/api/tipos';

interface PropsChipsCertificados {
  seleccionado?: CodigoCertificado;
  alSeleccionar: (codigo: CodigoCertificado | undefined) => void;
}

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
            onClick={() => alSeleccionar(activo ? undefined : codigo)}
          >
            {CERTIFICADOS[codigo]}
          </Chip>
        );
      })}
    </div>
  );
}
