import bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';
import { entorno } from '../../configuracion/entorno';
import {
  ErrorAccesoDenegado,
  ErrorNoAutenticado,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { registrador } from '../../utilidades/registrador';
import { repositorioTokens } from '../notificaciones/tokens';
import { repositorioUsuarios, type UsuarioConPerfil } from './repositorio';
import type {
  DatosActualizarPerfilCliente,
  DatosCambiarContrasena,
  DatosActualizarPreferencias,
  DatosTokenFcm,
} from './dto';

export const servicioUsuarios = {
  async obtenerPerfil(usuarioId: string): Promise<UsuarioConPerfil> {
    const usuario = await repositorioUsuarios.buscarPorIdActivo(usuarioId);
    if (!usuario) throw new ErrorNoEncontrado('Usuario');
    return usuario;
  },

  async actualizarPerfilCliente(
    usuarioId: string,
    rol: Rol,
    datos: DatosActualizarPerfilCliente,
  ): Promise<UsuarioConPerfil> {
    if (rol !== Rol.CLIENTE) {
      throw new ErrorAccesoDenegado('Solo los clientes pueden actualizar este perfil');
    }
    const usuario = await repositorioUsuarios.buscarPorIdActivo(usuarioId);
    if (!usuario) throw new ErrorNoEncontrado('Usuario');
    if (!usuario.cliente) {
      throw new ErrorReglaDeNegocio('El usuario no tiene perfil de cliente');
    }
    return repositorioUsuarios.actualizarCliente(usuarioId, datos);
  },

  async cambiarContrasena(usuarioId: string, datos: DatosCambiarContrasena): Promise<void> {
    // buscarHashContrasena devuelve solo los campos necesarios para la verificación
    const credenciales = await repositorioUsuarios.buscarHashContrasena(usuarioId);
    if (!credenciales || credenciales.fechaEliminacion) throw new ErrorNoEncontrado('Usuario');

    const valida = await bcrypt.compare(datos.contrasenaActual, credenciales.hashContrasena);
    if (!valida) throw new ErrorNoAutenticado('La contraseña actual es incorrecta');

    const nuevoHash = await bcrypt.hash(datos.contrasenaNueva, entorno.BCRYPT_ROUNDS);
    await repositorioUsuarios.actualizarContrasena(usuarioId, nuevoHash);
  },

  async eliminarCuenta(usuarioId: string): Promise<void> {
    const credenciales = await repositorioUsuarios.buscarHashContrasena(usuarioId);
    if (!credenciales || credenciales.fechaEliminacion) throw new ErrorNoEncontrado('Usuario');
    await repositorioUsuarios.eliminar(usuarioId);
  },

  async actualizarPreferencias(
    usuarioId: string,
    rol: Rol,
    preferencias: DatosActualizarPreferencias,
  ): Promise<void> {
    if (rol !== Rol.CLIENTE) {
      throw new ErrorAccesoDenegado(
        'Solo los clientes tienen preferencias de sostenibilidad',
      );
    }
    const usuario = await repositorioUsuarios.buscarPorIdActivo(usuarioId);
    if (!usuario || !usuario.cliente) throw new ErrorNoEncontrado('Perfil de cliente');
    await repositorioUsuarios.actualizarPreferencias(usuarioId, preferencias);
  },

  // Registra el token FCM del dispositivo (best-effort). Si Mongo está caído, se loguea y
  // se ignora: el push es opcional, no debe romper el alta del token.
  async registrarTokenFcm(usuarioId: string, datos: DatosTokenFcm): Promise<void> {
    try {
      await repositorioTokens.guardar(usuarioId, datos.token, datos.plataforma);
    } catch (error) {
      registrador.warn({ err: error }, '[notif] no se pudo guardar el token FCM (ignorado)');
    }
  },
};
