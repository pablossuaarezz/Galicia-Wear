import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ErrorApi,
  establecerSesion,
  hayTokenRefresco,
  limpiarSesion,
  registrarCierreForzado,
  solicitar,
} from './clienteApi';
import type { RespuestaTokens } from './tipos';

// Respuesta falsa con la interfaz mínima que usa el clienteApi (status/ok/json/text).
function resp(status: number, cuerpo?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
    text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
  } as Response;
}

const tokens = (acceso: string, refresco: string): RespuestaTokens => ({
  tokenAcceso: acceso,
  tokenRefresco: refresco,
  expiraEn: '15m',
  usuario: { id: '1', correo: 'a@galiciawear.gal', rol: 'CLIENTE' },
});

beforeEach(() => {
  localStorage.clear();
  limpiarSesion();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('clienteApi', () => {
  it('adjunta el token Bearer y devuelve el cuerpo JSON parseado', async () => {
    establecerSesion(tokens('A1', 'R1'));
    const fetchMock = vi.fn().mockResolvedValue(resp(200, { productos: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const datos = await solicitar<{ productos: unknown[] }>('/productos');

    expect(datos).toEqual({ productos: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/productos');
    expect((opciones.headers as Record<string, string>).Authorization).toBe('Bearer A1');
  });

  it('renueva el token al recibir 401 y reintenta la petición una sola vez', async () => {
    establecerSesion(tokens('CADUCADO', 'R1'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resp(401, { error: 'no auth', codigo: 'NO_AUTENTICADO' })) // 1ª petición
      .mockResolvedValueOnce(resp(200, tokens('NUEVO', 'R2'))) // /auth/refresh
      .mockResolvedValueOnce(resp(200, { usuario: { id: '1' } })); // reintento
    vi.stubGlobal('fetch', fetchMock);

    const datos = await solicitar<{ usuario: unknown }>('/usuarios/yo');

    expect(datos).toEqual({ usuario: { id: '1' } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // La 2ª llamada es el refresco con el tokenRefresco vigente.
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(fetchMock.mock.calls[1][1].body).toContain('R1');
    // El reintento usa el nuevo token de acceso.
    expect((fetchMock.mock.calls[2][1].headers as Record<string, string>).Authorization).toBe(
      'Bearer NUEVO',
    );
  });

  it('si el refresco falla, fuerza el cierre de sesión y propaga el error', async () => {
    establecerSesion(tokens('CADUCADO', 'R1'));
    const cierre = vi.fn();
    const desuscribir = registrarCierreForzado(cierre);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resp(401, { error: 'no auth', codigo: 'NO_AUTENTICADO' }))
      .mockResolvedValueOnce(resp(401, { error: 'refresco inválido' })); // /auth/refresh falla
    vi.stubGlobal('fetch', fetchMock);

    await expect(solicitar('/usuarios/yo')).rejects.toBeInstanceOf(ErrorApi);
    expect(cierre).toHaveBeenCalledTimes(1);
    expect(hayTokenRefresco()).toBe(false); // se limpió la sesión

    desuscribir();
  });
});
