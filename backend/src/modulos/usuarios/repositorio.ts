import { Prisma } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosActualizarPerfilCliente, DatosActualizarPreferencias } from './dto';

// Select explícito: excluye hashContrasena e ibanCifrado por seguridad.
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

export type UsuarioConPerfil = Prisma.UsuarioGetPayload<typeof seleccionPerfil>;

export class RepositorioUsuarios extends RepositorioBase<UsuarioConPerfil> {
  async buscarPorId(id: string): Promise<UsuarioConPerfil | null> {
    return this.bd.usuario.findUnique({ where: { id }, ...seleccionPerfil });
  }

  async buscarPorIdActivo(id: string): Promise<UsuarioConPerfil | null> {
    return this.bd.usuario.findUnique({
      where: { id, fechaEliminacion: null },
      ...seleccionPerfil,
    });
  }

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
          },
        },
      },
      ...seleccionPerfil,
    });
  }

  async actualizarContrasena(id: string, nuevoHash: string): Promise<void> {
    await this.bd.usuario.update({ where: { id }, data: { hashContrasena: nuevoHash } });
  }

  async actualizarPreferencias(
    usuarioId: string,
    preferencias: DatosActualizarPreferencias,
  ): Promise<void> {
    await this.bd.cliente.update({
      where: { usuarioId },
      data: { preferenciasSostenibilidad: preferencias as Prisma.InputJsonValue },
    });
  }

  // Solo para operaciones internas (cambio de contraseña). NUNCA usar en respuestas HTTP.
  async buscarHashContrasena(
    id: string,
  ): Promise<{ hashContrasena: string; fechaEliminacion: Date | null } | null> {
    return this.bd.usuario.findUnique({
      where: { id },
      select: { hashContrasena: true, fechaEliminacion: true },
    });
  }

  // Soft delete (GDPR): marca la cuenta como eliminada sin borrar datos transaccionales.
  async eliminar(id: string): Promise<void> {
    await this.bd.usuario.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });
  }
}

export const repositorioUsuarios = new RepositorioUsuarios();
