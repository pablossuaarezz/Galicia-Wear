// Repositorio del módulo de usuarios: encapsula el acceso a datos (Prisma)
// para la entidad Usuario y sus perfiles asociados (Cliente / Diseñador).
// Pone especial cuidado en NUNCA exponer campos sensibles (hash de
// contraseña, IBAN cifrado) salvo en consultas internas específicas
// destinadas exclusivamente a operaciones de seguridad (cambio de contraseña).

import { Prisma } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosActualizarPerfilCliente, DatosActualizarPreferencias } from './dto';

// Select explícito: excluye hashContrasena e ibanCifrado por seguridad.
// Se reutiliza en todas las consultas que devuelven el perfil de usuario
// para garantizar que estos campos sensibles nunca lleguen a una respuesta HTTP.
const seleccionPerfil = {
  select: {
    id: true,
    correo: true,
    rol: true,
    correoVerificado: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    fechaEliminacion: true,
    // hashContrasena: OMITIDA — nunca se expone en respuestas de perfil
    cliente: true,
    disenador: {
      select: {
        usuarioId: true,
        nombreMarca: true,
        biografia: true,
        ciudad: true,
        validado: true,
        fechaValidacion: true,
        urlLogo: true,
        urlWeb: true,
        fechaCreacion: true,
        // ibanCifrado: OMITIDO
      },
    },
  },
} as const;

// Tipo del usuario con su perfil, inferido automáticamente a partir del
// `select` anterior: garantiza que el tipo TypeScript siempre está
// sincronizado con los campos realmente seleccionados.
export type UsuarioConPerfil = Prisma.UsuarioGetPayload<typeof seleccionPerfil>;

export class RepositorioUsuarios extends RepositorioBase<UsuarioConPerfil> {
  /**
   * Busca un usuario por id, incluyendo cuentas ya eliminadas (soft delete).
   * @param id Identificador del usuario.
   * @returns El usuario con su perfil, o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<UsuarioConPerfil | null> {
    return this.bd.usuario.findUnique({ where: { id }, ...seleccionPerfil });
  }

  /**
   * Busca un usuario por id, excluyendo cuentas dadas de baja (GDPR).
   * Es la consulta usada en las operaciones normales del perfil propio,
   * para que una cuenta eliminada se comporte como inexistente.
   * @param id Identificador del usuario.
   * @returns El usuario con su perfil, o `null` si no existe o está eliminado.
   */
  async buscarPorIdActivo(id: string): Promise<UsuarioConPerfil | null> {
    return this.bd.usuario.findUnique({
      where: { id, fechaEliminacion: null },
      ...seleccionPerfil,
    });
  }

  /**
   * Actualiza parcialmente los datos del perfil de cliente asociado al usuario.
   * Solo se incluyen en la operación los campos definidos en `datos`
   * (actualización parcial real).
   * @param usuarioId Identificador del usuario (y de su registro Cliente asociado).
   * @param datos Campos a actualizar del perfil de cliente.
   * @returns El usuario actualizado con su perfil.
   */
  async actualizarCliente(
    usuarioId: string,
    datos: DatosActualizarPerfilCliente,
  ): Promise<UsuarioConPerfil> {
    return this.bd.usuario.update({
      where: { id: usuarioId },
      data: {
        cliente: {
          update: {
            ...(datos.nombre !== undefined && { nombre: datos.nombre }),
            ...(datos.apellidos !== undefined && { apellidos: datos.apellidos }),
            ...(datos.telefono !== undefined && { telefono: datos.telefono }),
            ...(datos.fechaNacimiento !== undefined && {
              fechaNacimiento: datos.fechaNacimiento,
            }),
            ...(datos.avatarUrl !== undefined && { avatarUrl: datos.avatarUrl }),
          },
        },
      },
      ...seleccionPerfil,
    });
  }

  /**
   * Sustituye el hash de contraseña almacenado por uno nuevo. El hash ya
   * debe venir calculado (p. ej. con bcrypt) desde el servicio.
   * @param id Identificador del usuario.
   * @param nuevoHash Nuevo hash de contraseña a almacenar.
   */
  async actualizarContrasena(id: string, nuevoHash: string): Promise<void> {
    await this.bd.usuario.update({ where: { id }, data: { hashContrasena: nuevoHash } });
  }

  /**
   * Sobrescribe las preferencias de sostenibilidad del cliente (almacenadas
   * como JSON en la columna `preferenciasSostenibilidad`).
   * @param usuarioId Identificador del usuario (y de su registro Cliente asociado).
   * @param preferencias Nuevas preferencias a guardar.
   */
  async actualizarPreferencias(
    usuarioId: string,
    preferencias: DatosActualizarPreferencias,
  ): Promise<void> {
    await this.bd.cliente.update({
      where: { usuarioId },
      data: { preferenciasSostenibilidad: preferencias as Prisma.InputJsonValue },
    });
  }

  /**
   * Recupera el hash de contraseña y la fecha de eliminación de un usuario.
   * Solo para operaciones internas (cambio de contraseña, baja de cuenta).
   * NUNCA usar el resultado de esta función en respuestas HTTP, ya que
   * contiene el hash de la contraseña.
   * @param id Identificador del usuario.
   * @returns El hash de contraseña y la fecha de eliminación, o `null` si no existe el usuario.
   */
  async buscarHashContrasena(
    id: string,
  ): Promise<{ hashContrasena: string; fechaEliminacion: Date | null } | null> {
    return this.bd.usuario.findUnique({
      where: { id },
      select: { hashContrasena: true, fechaEliminacion: true },
    });
  }

  /**
   * Soft delete (GDPR): marca la cuenta como eliminada (rellenando
   * `fechaEliminacion`) sin borrar físicamente los datos, para preservar
   * la integridad de pedidos y registros transaccionales históricos.
   * @param id Identificador del usuario a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.usuario.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });
  }
}

// Instancia única (singleton) del repositorio, usada por el servicio de usuarios.
export const repositorioUsuarios = new RepositorioUsuarios();
