import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorSesion, usarSesion } from './ContextoSesion';
import { RutaProtegida } from '@/rutas/RutaProtegida';

// El contexto se apoya en estos endpoints; los simulamos para no tocar la red.
vi.mock('@/api/endpoints/auth', () => ({
  apiAuth: {
    login: vi.fn().mockResolvedValue({
      tokenAcceso: 'A',
      tokenRefresco: 'R',
      expiraEn: '15m',
      usuario: { id: '1', correo: 'ana@galiciawear.gal', rol: 'CLIENTE' },
    }),
    yo: vi.fn().mockResolvedValue({
      id: '1',
      correo: 'ana@galiciawear.gal',
      rol: 'CLIENTE',
      nombre: 'Ana',
      apellidos: 'López',
      telefono: null,
      avatarUrl: null,
      fechaCreacion: '2026-01-01',
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

function envolver(ui: React.ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ProveedorSesion>{ui}</ProveedorSesion>
    </QueryClientProvider>
  );
}

function Sonda() {
  const { estaAutenticado, usuario, iniciarSesion, cerrarSesion } = usarSesion();
  return (
    <div>
      <span data-testid="estado">{estaAutenticado ? `si:${usuario?.nombre}` : 'no'}</span>
      <button onClick={() => iniciarSesion({ correo: 'ana@galiciawear.gal', contrasena: 'Prueba123' })}>
        entrar
      </button>
      <button onClick={() => cerrarSesion()}>salir</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('ContextoSesion', () => {
  it('inicia y cierra sesión actualizando el estado', async () => {
    render(envolver(<Sonda />));

    expect(screen.getByTestId('estado')).toHaveTextContent('no');

    fireEvent.click(screen.getByText('entrar'));
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('si:Ana'));

    fireEvent.click(screen.getByText('salir'));
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('no'));
  });

  it('RutaProtegida redirige a /login cuando no hay sesión', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProveedorSesion>
          <MemoryRouter initialEntries={['/secreto']}>
            <Routes>
              <Route path="/login" element={<p>Pantalla de acceso</p>} />
              <Route
                path="/secreto"
                element={
                  <RutaProtegida>
                    <p>Contenido privado</p>
                  </RutaProtegida>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </MemoryRouter>
        </ProveedorSesion>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });
});
