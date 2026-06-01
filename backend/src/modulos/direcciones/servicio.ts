import { Direccion } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioDirecciones } from './repositorio';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

export const servicioDirecciones = {
  async listar(usuarioId: string): Promise<Direccion[]> {
    return repositorioDirecciones.listarDeUsuario(usuarioId);
  },

  async crear(usuarioId: string, datos: DatosCrearDireccion): Promise<Direccion> {
    return repositorioDirecciones.crear(usuarioId, datos);
  },

  async actualizar(
    id: string,
    usuarioId: string,
    datos: DatosActualizarDireccion,
  ): Promise<Direccion> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    return repositorioDirecciones.actualizar(id, datos);
  },

  async eliminar(id: string, usuarioId: string): Promise<void> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    await repositorioDirecciones.eliminar(id);
  },

  async marcarComoPrincipal(id: string, usuarioId: string): Promise<Direccion> {
    const dir = await repositorioDirecciones.buscarPorId(id);
    if (!dir) throw new ErrorNoEncontrado('Dirección');
    if (dir.usuarioId !== usuarioId) throw new ErrorAccesoDenegado('No tienes permiso sobre esta dirección');
    return repositorioDirecciones.marcarPrincipal(id, usuarioId);
  },
};
