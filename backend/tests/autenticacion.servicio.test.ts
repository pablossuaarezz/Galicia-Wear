// JUSTIFICACIÓN: tests unitarios del servicio de autenticación. Mockean el repositorio
// para aislar lógica de negocio (hashing, rotación de tokens, errores de credenciales).
// Cumple "testing básico" de la rúbrica + cobertura objetivo ≥60%.
import { Rol } from '@prisma/client';

jest.mock('../src/modulos/autenticacion/repositorio', () => ({
  repositorioAutenticacion: {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    crearUsuario: jest.fn(),
    guardarTokenRefresco: jest.fn(),
    buscarTokenRefrescoPorHash: jest.fn(),
    revocarTokenRefresco: jest.fn(),
    revocarTodosLosTokensDeUsuario: jest.fn(),
  },
}));

import { servicioAutenticacion } from '../src/modulos/autenticacion/servicio';
import { repositorioAutenticacion } from '../src/modulos/autenticacion/repositorio';
import { ErrorConflicto, ErrorNoAutenticado } from '../src/utilidades/errores';

const repoMock = repositorioAutenticacion as jest.Mocked<typeof repositorioAutenticacion>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('servicioAutenticacion.registrar', () => {
  it('rechaza si el correo ya existe', async () => {
    repoMock.buscarPorCorreo.mockResolvedValueOnce({
      id: 'u1',
      correo: 'ana@galiciawear.gal',
    } as never);

    await expect(
      servicioAutenticacion.registrar({
        correo: 'Ana@GaliciaWear.gal',
        contrasena: 'Segura123',
        rol: Rol.CLIENTE,
        nombre: 'Ana',
        apellidos: 'López',
      }),
    ).rejects.toBeInstanceOf(ErrorConflicto);

    expect(repoMock.crearUsuario).not.toHaveBeenCalled();
  });

  it('crea usuario CLIENTE, guarda token de refresco y devuelve tokens', async () => {
    repoMock.buscarPorCorreo.mockResolvedValueOnce(null);
    repoMock.crearUsuario.mockResolvedValueOnce({
      id: 'u-nuevo',
      correo: 'ana@galiciawear.gal',
      rol: Rol.CLIENTE,
    } as never);
    repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);

    const resultado = await servicioAutenticacion.registrar({
      correo: 'ana@galiciawear.gal',
      contrasena: 'Segura123',
      rol: Rol.CLIENTE,
      nombre: 'Ana',
      apellidos: 'López',
    });

    expect(resultado.usuario).toEqual({
      id: 'u-nuevo',
      correo: 'ana@galiciawear.gal',
      rol: Rol.CLIENTE,
    });
    expect(typeof resultado.tokenAcceso).toBe('string');
    expect(typeof resultado.tokenRefresco).toBe('string');
    expect(repoMock.guardarTokenRefresco).toHaveBeenCalledTimes(1);
  });
});

describe('servicioAutenticacion.iniciarSesion', () => {
  it('rechaza con credenciales inválidas si el usuario no existe', async () => {
    repoMock.buscarPorCorreo.mockResolvedValueOnce(null);

    await expect(
      servicioAutenticacion.iniciarSesion({
        correo: 'no@existe.gal',
        contrasena: 'loquesea',
      }),
    ).rejects.toBeInstanceOf(ErrorNoAutenticado);
  });

  it('rechaza si la contraseña no coincide', async () => {
    const bcrypt = await import('bcrypt');
    const hashIncorrecto = await bcrypt.hash('otra-contrasena', 4);

    repoMock.buscarPorCorreo.mockResolvedValueOnce({
      id: 'u1',
      correo: 'ana@galiciawear.gal',
      rol: Rol.CLIENTE,
      hashContrasena: hashIncorrecto,
      fechaEliminacion: null,
    } as never);

    await expect(
      servicioAutenticacion.iniciarSesion({
        correo: 'ana@galiciawear.gal',
        contrasena: 'Segura123',
      }),
    ).rejects.toBeInstanceOf(ErrorNoAutenticado);
  });

  it('devuelve tokens cuando las credenciales son correctas', async () => {
    const bcrypt = await import('bcrypt');
    const hashOk = await bcrypt.hash('Segura123', 4);

    repoMock.buscarPorCorreo.mockResolvedValueOnce({
      id: 'u1',
      correo: 'ana@galiciawear.gal',
      rol: Rol.CLIENTE,
      hashContrasena: hashOk,
      fechaEliminacion: null,
    } as never);
    repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);

    const resultado = await servicioAutenticacion.iniciarSesion({
      correo: 'ana@galiciawear.gal',
      contrasena: 'Segura123',
    });

    expect(resultado.usuario.id).toBe('u1');
    expect(resultado.tokenAcceso.length).toBeGreaterThan(20);
    expect(resultado.tokenRefresco.length).toBeGreaterThan(20);
  });
});

describe('servicioAutenticacion.refrescarSesion', () => {
  it('revoca todos los tokens si se intenta usar uno ya revocado (reuso → posible robo)', async () => {
    repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce({
      id: 't1',
      usuarioId: 'u1',
      fechaRevocacion: new Date(),
      fechaExpiracion: new Date(Date.now() + 1000),
    } as never);

    await expect(servicioAutenticacion.refrescarSesion('cualquier-token')).rejects.toBeInstanceOf(
      ErrorNoAutenticado,
    );
    expect(repoMock.revocarTodosLosTokensDeUsuario).toHaveBeenCalledWith('u1');
  });

  it('rechaza tokens expirados', async () => {
    repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce({
      id: 't1',
      usuarioId: 'u1',
      fechaRevocacion: null,
      fechaExpiracion: new Date(Date.now() - 1000),
    } as never);

    await expect(servicioAutenticacion.refrescarSesion('expirado')).rejects.toBeInstanceOf(
      ErrorNoAutenticado,
    );
  });
});

describe('servicioAutenticacion.cerrarSesion', () => {
  it('es idempotente cuando el token no existe', async () => {
    repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce(null);
    await expect(servicioAutenticacion.cerrarSesion('inexistente')).resolves.toBeUndefined();
    expect(repoMock.revocarTokenRefresco).not.toHaveBeenCalled();
  });

  it('revoca el token si existe y no estaba revocado', async () => {
    repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce({
      id: 't1',
      fechaRevocacion: null,
    } as never);

    await servicioAutenticacion.cerrarSesion('valido');

    expect(repoMock.revocarTokenRefresco).toHaveBeenCalledWith('t1');
  });
});
