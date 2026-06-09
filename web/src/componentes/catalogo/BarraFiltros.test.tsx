import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BarraFiltros } from './BarraFiltros';
import type { FiltrosCatalogo } from '@/api/tipos';

function montar(valores: FiltrosCatalogo = {}) {
  const alActualizar = vi.fn();
  const alLimpiar = vi.fn();
  render(<BarraFiltros valores={valores} alActualizar={alActualizar} alLimpiar={alLimpiar} />);
  return { alActualizar, alLimpiar };
}

describe('<BarraFiltros />', () => {
  it('emite la búsqueda al escribir', () => {
    const { alActualizar } = montar();
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'lino' } });
    expect(alActualizar).toHaveBeenCalledWith({ busqueda: 'lino' });
  });

  it('emite el material seleccionado', () => {
    const { alActualizar } = montar();
    fireEvent.change(screen.getByLabelText('Material'), { target: { value: 'LINO' } });
    expect(alActualizar).toHaveBeenCalledWith({ material: 'LINO' });
  });

  it('emite el certificado al pulsar su chip y permite alternarlo', () => {
    const { alActualizar } = montar({ certificado: undefined });
    fireEvent.click(screen.getByRole('button', { name: 'GOTS' }));
    expect(alActualizar).toHaveBeenCalledWith({ certificado: 'GOTS' });
  });

  it('llama a alLimpiar cuando hay filtros activos', () => {
    const { alLimpiar } = montar({ material: 'LINO' });
    fireEvent.click(screen.getByText('Limpiar'));
    expect(alLimpiar).toHaveBeenCalled();
  });
});
