/**
 * Servicio del módulo Direcciones.
 *
 * Contiene la lógica de negocio y de autorización para la gestión de
 * direcciones de envío: comprueba que la dirección sobre la que se opera
 * pertenece al usuario autenticado antes de actualizarla, eliminarla o
 * marcarla como principal, delegando el acceso a datos en
 * `repositorioDirecciones`.
 */
import { Direccion } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioDirecciones } from './repositorio';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

export const servicioDirecciones = {
  /**
   * Lista todas las direcciones del usuario autenticado.
   * @param usuarioId identificador del usuario.
   * @returns lista de direcciones del usuario.
   */
  async listar(usuarioId: string): Promise<Direccion[]> {
    return repositorioDirecciones.listarDeUsuario(usuarioId);
  },

  /**
   * Crea una nueva dirección para el usuario autenticado. No requiere
   * comprobación de propiedad adicional, ya que la dirección se asocia
   * directamente al usuario que realiza la petición.
   * @param usuarioId identificador del usuario propietario de la nueva dirección.
   * @param datos datos de la dirección, ya validados por `dtoCrearDireccion`.
   * @returns la dirección creada.
   */
  async crear(usuarioId: string, datos: DatosCrearDireccion): Promise<Direccion> {
    return repositorioDirecciones.crear(usuarioId, datos);
  },

  /**
   * Actualiza parcialmente una dirección existente, verificando previamente
   * que pertenezca al usuario autenticado.
   * @param id identificador de la dirección a actualizar.
   * @param usuarioId identificador del usuario autenticado.
   * @param datos campos a actualizar, ya validados por `dtoActualizarDireccion`.
   * @returns la dirección actualizada.
   * @throws ErrorNoEncontrado si la dirección no existe.
   * @throws ErrorAccesoDenegado si la dirección no pertenece al usuario.
   */
  async actualizar(
    id: string,
    usuarioId: string,
    datos: DatosActualizarDireccion,
  ): Promise<Direccion> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    // Comprobación de autorización: una dirección solo puede ser modificada
    // por su propietario, aunque el usuario esté autenticado correctamente.
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    return repositorioDirecciones.actualizar(id, datos);
  },

  /**
   * Elimina una dirección existente, verificando previamente que pertenezca
   * al usuario autenticado.
   * @param id identificador de la dirección a eliminar.
   * @param usuarioId identificador del usuario autenticado.
   * @throws ErrorNoEncontrado si la dirección no existe.
   * @throws ErrorAccesoDenegado si la dirección no pertenece al usuario.
   */
  async eliminar(id: string, usuarioId: string): Promise<void> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    await repositorioDirecciones.eliminar(id);
  },

  /**
   * Marca una dirección como principal para el usuario autenticado, verificando
   * previamente que la dirección le pertenezca. La lógica de desmarcar las
   * demás direcciones y sincronizar el perfil del cliente se delega en el
   * repositorio (transacción Prisma).
   * @param id identificador de la dirección a marcar como principal.
   * @param usuarioId identificador del usuario autenticado.
   * @returns la dirección marcada como principal.
   * @throws ErrorNoEncontrado si la dirección no existe.
   * @throws ErrorAccesoDenegado si la dirección no pertenece al usuario.
   */
  async marcarComoPrincipal(id: string, usuarioId: string): Promise<Direccion> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    return repositorioDirecciones.marcarPrincipal(id, usuarioId);
  },
};
