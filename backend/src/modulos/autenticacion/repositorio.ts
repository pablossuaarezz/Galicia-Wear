// JUSTIFICACIÓN: capa de repositorio. Aísla el acceso a Prisma del resto del módulo.
// Si mañana cambiamos de ORM, solo este archivo se reescribe.
// Patrón Repository → cumple "POO + capas" de la rúbrica DAM.
//
// Este fichero agrupa todas las consultas Prisma relacionadas con autenticación:
// usuarios (búsqueda, creación) y tokens de refresco (creación, búsqueda por hash,
// revocación individual o masiva).
import { Prisma, Rol, Usuario } from '@prisma/client';
import { prisma } from '../../utilidades/prisma';

/** Datos necesarios para crear un nuevo usuario, incluyendo opcionalmente el perfil de cliente. */
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
  /**
   * Busca un usuario por su correo electrónico (único en la base de datos).
   * @param correo Correo electrónico normalizado (en minúsculas).
   * @returns El usuario encontrado o `null` si no existe.
   */
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { correo } });
  },

  /**
   * Busca un usuario por su identificador único.
   * @param id Identificador del usuario.
   * @returns El usuario encontrado o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  },

  // Perfil completo para /auth/yo: incluye los datos de cliente o diseñador,
  // donde viven nombre/apellidos (Cliente) y nombreMarca (Disenador).
  /**
   * Obtiene el usuario junto con sus relaciones de cliente y diseñador, usado
   * para construir la respuesta de `/auth/yo`.
   * @param id Identificador del usuario.
   * @returns El usuario con sus relaciones `cliente` y `disenador` incluidas, o `null`.
   */
  async buscarPerfilCompleto(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      include: { cliente: true, disenador: true },
    });
  },

  /**
   * Crea un nuevo usuario en la base de datos. Si el rol es CLIENTE y se han
   * proporcionado datos de cliente (nombre/apellidos), crea también el perfil
   * de cliente asociado en la misma operación (relación anidada de Prisma).
   * @param datos Datos del usuario a crear (correo, hash de contraseña, rol y, opcionalmente, perfil de cliente).
   * @returns El usuario creado.
   */
  async crearUsuario(datos: DatosCreacionUsuario): Promise<Usuario> {
    const datosUsuario: Prisma.UsuarioCreateInput = {
      correo: datos.correo,
      hashContrasena: datos.hashContrasena,
      rol: datos.rol,
    };

    // Si es CLIENTE y se han enviado nombre+apellidos, creamos también el perfil cliente
    // Usar una creación anidada (`cliente: { create: {...} }`) garantiza que el usuario
    // y su perfil de cliente se creen de forma atómica en la misma transacción implícita de Prisma.
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

  /**
   * Persiste un nuevo token de refresco emitido para un usuario, junto con
   * metadatos del dispositivo/sesión (agente de usuario e IP) para auditoría.
   * @param datos Datos del token: usuario asociado, hash SHA-256 del token (nunca el token en claro),
   * fecha de expiración y metadatos opcionales de la petición.
   */
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

  /**
   * Busca un token de refresco por su hash SHA-256 (el valor almacenado, nunca el token en claro).
   * @param hashToken Hash SHA-256 hexadecimal del token de refresco recibido del cliente.
   * @returns El registro del token (incluye fechas de expiración/revocación) o `null` si no existe.
   */
  async buscarTokenRefrescoPorHash(hashToken: string) {
    return prisma.tokenRefresco.findUnique({ where: { hashToken } });
  },

  /**
   * Marca un token de refresco como revocado, registrando la fecha de revocación.
   * Se usa tanto en logout como en la rotación de tokens (refresh).
   * @param id Identificador interno del registro de token de refresco.
   */
  async revocarTokenRefresco(id: string): Promise<void> {
    await prisma.tokenRefresco.update({
      where: { id },
      data: { fechaRevocacion: new Date() },
    });
  },

  /**
   * Revoca todos los tokens de refresco activos (no revocados aún) de un usuario.
   * Se usa como medida de seguridad cuando se detecta el reuso de un token ya
   * revocado, lo que indica una posible sustracción del token.
   * @param usuarioId Identificador del usuario cuyas sesiones se cerrarán.
   */
  async revocarTodosLosTokensDeUsuario(usuarioId: string): Promise<void> {
    await prisma.tokenRefresco.updateMany({
      where: { usuarioId, fechaRevocacion: null },
      data: { fechaRevocacion: new Date() },
    });
  },
};
