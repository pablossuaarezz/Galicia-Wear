// JUSTIFICACIÓN: capa de repositorio. Aísla el acceso a Prisma del resto del módulo.
// Si mañana cambiamos de ORM, solo este archivo se reescribe.
// Patrón Repository → cumple "POO + capas" de la rúbrica DAM.
import { Prisma, Rol, Usuario } from '@prisma/client';
import { prisma } from '../../utilidades/prisma';

export interface DatosCreacionUsuario {
  correo: string;
  hashContrasena: string;
  rol: Rol;
  cliente?: {
    nombre: string;
    apellidos: string;
  };
}

export const repositorioAutenticacion = {
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { correo } });
  },

  async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  },

  async crearUsuario(datos: DatosCreacionUsuario): Promise<Usuario> {
    const datosUsuario: Prisma.UsuarioCreateInput = {
      correo: datos.correo,
      hashContrasena: datos.hashContrasena,
      rol: datos.rol,
    };

    // Si es CLIENTE y se han enviado nombre+apellidos, creamos también el perfil cliente
    if (datos.rol === Rol.CLIENTE && datos.cliente) {
      datosUsuario.cliente = {
        create: {
          nombre: datos.cliente.nombre,
          apellidos: datos.cliente.apellidos,
        },
      };
    }

    return prisma.usuario.create({ data: datosUsuario });
  },

  async guardarTokenRefresco(datos: {
    usuarioId: string;
    hashToken: string;
    fechaExpiracion: Date;
    agenteUsuario?: string;
    ipOrigen?: string;
  }): Promise<void> {
    await prisma.tokenRefresco.create({
      data: {
        usuarioId: datos.usuarioId,
        hashToken: datos.hashToken,
        fechaExpiracion: datos.fechaExpiracion,
        agenteUsuario: datos.agenteUsuario,
        ipOrigen: datos.ipOrigen,
      },
    });
  },

  async buscarTokenRefrescoPorHash(hashToken: string) {
    return prisma.tokenRefresco.findUnique({ where: { hashToken } });
  },

  async revocarTokenRefresco(id: string): Promise<void> {
    await prisma.tokenRefresco.update({
      where: { id },
      data: { fechaRevocacion: new Date() },
    });
  },

  async revocarTodosLosTokensDeUsuario(usuarioId: string): Promise<void> {
    await prisma.tokenRefresco.updateMany({
      where: { usuarioId, fechaRevocacion: null },
      data: { fechaRevocacion: new Date() },
    });
  },
};
