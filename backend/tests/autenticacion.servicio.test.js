"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// JUSTIFICACIÓN: tests unitarios del servicio de autenticación. Mockean el repositorio
// para aislar lógica de negocio (hashing, rotación de tokens, errores de credenciales).
// Cumple "testing básico" de la rúbrica + cobertura objetivo ≥60%.
const client_1 = require("@prisma/client");
jest.mock('../src/utilidades/auditoria', () => ({ registrarActividad: jest.fn() }));
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
const servicio_1 = require("../src/modulos/autenticacion/servicio");
const repositorio_1 = require("../src/modulos/autenticacion/repositorio");
const errores_1 = require("../src/utilidades/errores");
const repoMock = repositorio_1.repositorioAutenticacion;
beforeEach(() => {
    jest.clearAllMocks();
});
describe('servicioAutenticacion.registrar', () => {
    it('rechaza si el correo ya existe', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce({
            id: 'u1',
            correo: 'ana@galiciawear.gal',
        });
        await expect(servicio_1.servicioAutenticacion.registrar({
            correo: 'Ana@GaliciaWear.gal',
            contrasena: 'Segura123',
            rol: client_1.Rol.CLIENTE,
            nombre: 'Ana',
            apellidos: 'López',
        })).rejects.toBeInstanceOf(errores_1.ErrorConflicto);
        expect(repoMock.crearUsuario).not.toHaveBeenCalled();
    });
    it('crea usuario CLIENTE, guarda token de refresco y devuelve tokens', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce(null);
        repoMock.crearUsuario.mockResolvedValueOnce({
            id: 'u-nuevo',
            correo: 'ana@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
        });
        repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);
        const resultado = await servicio_1.servicioAutenticacion.registrar({
            correo: 'ana@galiciawear.gal',
            contrasena: 'Segura123',
            rol: client_1.Rol.CLIENTE,
            nombre: 'Ana',
            apellidos: 'López',
        });
        expect(resultado.usuario).toEqual({
            id: 'u-nuevo',
            correo: 'ana@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
        });
        expect(typeof resultado.tokenAcceso).toBe('string');
        expect(typeof resultado.tokenRefresco).toBe('string');
        expect(repoMock.guardarTokenRefresco).toHaveBeenCalledTimes(1);
    });
});
describe('servicioAutenticacion.iniciarSesion', () => {
    it('rechaza con credenciales inválidas si el usuario no existe', async () => {
        repoMock.buscarPorCorreo.mockResolvedValueOnce(null);
        await expect(servicio_1.servicioAutenticacion.iniciarSesion({
            correo: 'no@existe.gal',
            contrasena: 'loquesea',
        })).rejects.toBeInstanceOf(errores_1.ErrorNoAutenticado);
    });
    it('rechaza si la contraseña no coincide', async () => {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const hashIncorrecto = await bcrypt.hash('otra-contrasena', 4);
        repoMock.buscarPorCorreo.mockResolvedValueOnce({
            id: 'u1',
            correo: 'ana@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
            hashContrasena: hashIncorrecto,
            fechaEliminacion: null,
        });
        await expect(servicio_1.servicioAutenticacion.iniciarSesion({
            correo: 'ana@galiciawear.gal',
            contrasena: 'Segura123',
        })).rejects.toBeInstanceOf(errores_1.ErrorNoAutenticado);
    });
    it('devuelve tokens cuando las credenciales son correctas', async () => {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const hashOk = await bcrypt.hash('Segura123', 4);
        repoMock.buscarPorCorreo.mockResolvedValueOnce({
            id: 'u1',
            correo: 'ana@galiciawear.gal',
            rol: client_1.Rol.CLIENTE,
            hashContrasena: hashOk,
            fechaEliminacion: null,
        });
        repoMock.guardarTokenRefresco.mockResolvedValueOnce(undefined);
        const resultado = await servicio_1.servicioAutenticacion.iniciarSesion({
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
        });
        await expect(servicio_1.servicioAutenticacion.refrescarSesion('cualquier-token')).rejects.toBeInstanceOf(errores_1.ErrorNoAutenticado);
        expect(repoMock.revocarTodosLosTokensDeUsuario).toHaveBeenCalledWith('u1');
    });
    it('rechaza tokens expirados', async () => {
        repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce({
            id: 't1',
            usuarioId: 'u1',
            fechaRevocacion: null,
            fechaExpiracion: new Date(Date.now() - 1000),
        });
        await expect(servicio_1.servicioAutenticacion.refrescarSesion('expirado')).rejects.toBeInstanceOf(errores_1.ErrorNoAutenticado);
    });
});
describe('servicioAutenticacion.cerrarSesion', () => {
    it('es idempotente cuando el token no existe', async () => {
        repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce(null);
        await expect(servicio_1.servicioAutenticacion.cerrarSesion('inexistente')).resolves.toBeUndefined();
        expect(repoMock.revocarTokenRefresco).not.toHaveBeenCalled();
    });
    it('revoca el token si existe y no estaba revocado', async () => {
        repoMock.buscarTokenRefrescoPorHash.mockResolvedValueOnce({
            id: 't1',
            fechaRevocacion: null,
        });
        await servicio_1.servicioAutenticacion.cerrarSesion('valido');
        expect(repoMock.revocarTokenRefresco).toHaveBeenCalledWith('t1');
    });
});
//# sourceMappingURL=autenticacion.servicio.test.js.map