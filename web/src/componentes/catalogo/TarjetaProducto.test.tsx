import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TarjetaProducto } from './TarjetaProducto';
import type { ProductoResumen } from '@/api/tipos';

const producto: ProductoResumen = {
  id: 'p1',
  disenadorId: 'd1',
  nombre: 'Jersey atlántico',
  slug: 'jersey-atlantico-abc123',
  precioBase: '49.90',
  kmOrigen: 10,
  materialPrincipal: 'LANA_RECICLADA',
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00.000Z',
  disenador: { nombreMarca: 'Liñares Moda', ciudad: 'CORUNA', urlLogo: null },
  imagenes: [],
  certificados: [{ certificado: { codigo: 'GOTS', nombre: 'GOTS' } }],
};

describe('<TarjetaProducto />', () => {
  it('muestra nombre, marca, precio formateado y certificado, y enlaza al detalle', () => {
    const { container } = render(
      <MemoryRouter>
        <TarjetaProducto producto={producto} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Jersey atlántico')).toBeInTheDocument();
    expect(screen.getByText('Liñares Moda')).toBeInTheDocument();
    expect(screen.getByText(/49,90/)).toBeInTheDocument();
    expect(screen.getByText('GOTS')).toBeInTheDocument();

    const enlace = container.querySelector('a');
    expect(enlace).toHaveAttribute('href', '/producto/jersey-atlantico-abc123');
  });
});
