// Servicio (capa de lógica de negocio) del módulo de usuarios.
// Gestiona el perfil del usuario autenticado: consulta de datos, edición del
// perfil de cliente, cambio de contraseña (con verificación de la actual),
// baja de cuenta (soft delete por GDPR), preferencias de sostenibilidad y
// registro del token de notificaciones push.

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
  /**
   * Obtiene el perfil completo del usuario autenticado (excluyendo cuentas
   * dadas de baja).
   * @param usuarioId Identificador del usuario autenticado.
   * @returns El perfil del usuario.
   * @throws ErrorNoEncontrado si el usuario no existe o está eliminado.
   */
  async obtenerPerfil(usuarioId: string): Promise<UsuarioConPerfil> {
    const usuario = await repositorioUsuarios.buscarPorIdActivo(usuarioId);
    if (!usuario) throw new ErrorNoEncontrado('Usuario');
    return usuario;
  },

  /**
   * Actualiza el perfil de cliente del usuario autenticado. Solo los
   * usuarios con rol CLIENTE (y que de hecho tengan un perfil de cliente
   * asociado) pueden realizar esta operación.
   * @param usuarioId Identificador del usuario autenticado.
   * @param rol Rol del usuario autenticado.
   * @param datos Campos a actualizar del perfil de cliente.
   * @returns El perfil de usuario actualizado.
   * @throws ErrorAccesoDenegado si el rol no es CLIENTE.
   * @throws ErrorNoEncontrado si el usuario no existe o está eliminado.
   * @throws ErrorReglaDeNegocio si el usuario no tiene perfil de cliente.
   */
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

  /**
   * Cambia la contraseña del usuario autenticado, verificando primero que
   * la contraseña actual proporcionada coincide con el hash almacenado.
   * @param usuarioId Identificador del usuario autenticado.
   * @param datos Contraseña actual y nueva contraseña validada.
   * @throws ErrorNoEncontrado si el usuario no existe o está eliminado.
   * @throws ErrorNoAutenticado si la contraseña actual no es correcta.
   */
  async cambiarContrasena(usuarioId: string, datos: DatosCambiarContrasena): Promise<void> {
    // buscarHashContrasena devuelve solo los campos necesarios para la verificación
    const credenciales = await repositorioUsuarios.buscarHashContrasena(usuarioId);
    if (!credenciales || credenciales.fechaEliminacion) throw new ErrorNoEncontrado('Usuario');

    // bcrypt.compare evita comparar contraseñas en texto plano: compara el
    // texto introducido con el hash almacenado de forma segura.
    const valida = await bcrypt.compare(datos.contrasenaActual, credenciales.hashContrasena);
    if (!valida) throw new ErrorNoAutenticado('La contraseña actual es incorrecta');

    // Se genera un nuevo hash con el coste de bcrypt configurado en el entorno
    // antes de persistir la nueva contraseña.
    const nuevoHash = await bcrypt.hash(datos.contrasenaNueva, entorno.BCRYPT_ROUNDS);
    await repositorioUsuarios.actualizarContrasena(usuarioId, nuevoHash);
  },

  /**
   * Da de baja (soft delete) la cuenta del usuario autenticado, conforme a
   * los requisitos de GDPR: no se borran físicamente los datos para
   * preservar la integridad de pedidos y otros registros históricos.
   * @param usuarioId Identificador del usuario autenticado.
   * @throws ErrorNoEncontrado si el usuario no existe o ya estaba eliminado.
   */
  async eliminarCuenta(usuarioId: string): Promise<void> {
    const credenciales = await repositorioUsuarios.buscarHashContrasena(usuarioId);
    if (!credenciales || credenciales.fechaEliminacion) throw new ErrorNoEncontrado('Usuario');
    await repositorioUsuarios.eliminar(usuarioId);
  },

  /**
   * Actualiza las preferencias de sostenibilidad del cliente autenticado.
   * Solo los usuarios con rol CLIENTE (y con perfil de cliente asociado)
   * tienen este tipo de preferencias.
   * @param usuarioId Identificador del usuario autenticado.
   * @param rol Rol del usuario autenticado.
   * @param preferencias Nuevas preferencias a guardar.
   * @throws ErrorAccesoDenegado si el rol no es CLIENTE.
   * @throws ErrorNoEncontrado si el usuario no existe, está eliminado o no tiene perfil de cliente.
   */
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

  /**
   * Registra el token FCM del dispositivo (best-effort). Si Mongo está caído, se loguea y
   * se ignora: el push es opcional, no debe romper el alta del token.
   * @param usuarioId Identificador del usuario autenticado.
   * @param datos Token FCM y plataforma del dispositivo.
   */
  async registrarTokenFcm(usuarioId: string, datos: DatosTokenFcm): Promise<void> {
    try {
      await repositorioTokens.guardar(usuarioId, datos.token, datos.plataforma);
    } catch (error) {
      registrador.warn({ err: error }, '[notif] no se pudo guardar el token FCM (ignorado)');
    }
  },
};
