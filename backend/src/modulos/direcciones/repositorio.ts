/**
 * Repositorio del módulo Direcciones.
 *
 * Encapsula el acceso a Prisma para el modelo `Direccion`: listado de
 * direcciones de un usuario, creación, actualización parcial, eliminación y
 * el cambio de dirección principal (que afecta también al modelo `Cliente`
 * mediante una transacción).
 */
import { Direccion } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

/**
 * Repositorio de acceso a datos de direcciones de envío.
 * Extiende `RepositorioBase` para reutilizar la conexión a base de datos (`this.bd`).
 */
export class RepositorioDirecciones extends RepositorioBase<Direccion> {
  /**
   * Busca una dirección por su identificador.
   * @param id identificador de la dirección.
   * @returns la dirección o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<Direccion | null> {
    return this.bd.direccion.findUnique({ where: { id } });
  }

  /**
   * Lista todas las direcciones de un usuario, mostrando primero la dirección
   * marcada como principal (`esPrincipal: desc`) y, dentro de cada grupo,
   * ordenadas alfabéticamente por alias para facilitar su localización en la UI.
   * @param usuarioId identificador del usuario propietario de las direcciones.
   * @returns lista de direcciones ordenadas.
   */
  async listarDeUsuario(usuarioId: string): Promise<Direccion[]> {
    return this.bd.direccion.findMany({
      where: { usuarioId },
      orderBy: [{ esPrincipal: 'desc' }, { alias: 'asc' }],
    });
  }

  /**
   * Crea una nueva dirección para el usuario indicado. Los campos opcionales con
   * valor por defecto en el DTO (`provincia`, `pais`) se reafirman aquí con `??`
   * por si llegaran como `undefined` (defensa adicional, ya que Zod ya aplica
   * los valores por defecto).
   * @param usuarioId identificador del usuario propietario de la nueva dirección.
   * @param datos datos de la dirección, ya validados por `dtoCrearDireccion`.
   * @returns la dirección creada.
   */
  async crear(usuarioId: string, datos: DatosCrearDireccion): Promise<Direccion> {
    return this.bd.direccion.create({
      data: {
        usuarioId,
        alias: datos.alias,
        linea1: datos.linea1,
        linea2: datos.linea2 ?? null,
        ciudad: datos.ciudad,
        codigoPostal: datos.codigoPostal,
        provincia: datos.provincia ?? 'A Coruña',
        pais: datos.pais ?? 'ES',
      },
    });
  }

  /**
   * Actualiza parcialmente una dirección existente. Construye el objeto `data`
   * de Prisma incluyendo únicamente los campos que vienen definidos en `datos`
   * (distintos de `undefined`), de modo que los campos no enviados en la petición
   * de actualización conserven su valor actual en la base de datos.
   * @param id identificador de la dirección a actualizar.
   * @param datos campos a actualizar, ya validados por `dtoActualizarDireccion`.
   * @returns la dirección actualizada.
   */
  async actualizar(id: string, datos: DatosActualizarDireccion): Promise<Direccion> {
    return this.bd.direccion.update({
      where: { id },
      data: {
        // El patrón `...(condicion && { campo: valor })` permite añadir la
        // propiedad al objeto `data` solo si el campo fue proporcionado,
        // evitando sobrescribir con `undefined` los campos no enviados.
        ...(datos.alias !== undefined && { alias: datos.alias }),
        ...(datos.linea1 !== undefined && { linea1: datos.linea1 }),
        ...(datos.linea2 !== undefined && { linea2: datos.linea2 }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad }),
        ...(datos.codigoPostal !== undefined && { codigoPostal: datos.codigoPostal }),
        ...(datos.provincia !== undefined && { provincia: datos.provincia }),
        ...(datos.pais !== undefined && { pais: datos.pais }),
      },
    });
  }

  /**
   * Marca una dirección como principal para el usuario, garantizando que solo
   * exista una dirección principal a la vez y sincronizando la referencia en
   * el modelo `Cliente` (`direccionPredeterminadaId`).
   *
   * Se ejecuta dentro de una transacción Prisma (`$transaction`) para asegurar
   * la atomicidad de los tres pasos: si alguno falla, no se aplica ninguno.
   * @param id identificador de la dirección que pasará a ser principal.
   * @param usuarioId identificador del usuario propietario de la dirección.
   * @returns la dirección actualizada con `esPrincipal: true`.
   */
  async marcarPrincipal(id: string, usuarioId: string): Promise<Direccion> {
    // Transacción: quitar principal de todas, poner en la elegida, actualizar cliente.
    return this.bd.$transaction(async (tx) => {
      // 1. Desmarcar como principal cualquier otra dirección del usuario.
      await tx.direccion.updateMany({
        where: { usuarioId, id: { not: id } },
        data: { esPrincipal: false },
      });
      // 2. Actualizar la referencia de dirección predeterminada en el perfil de cliente.
      await tx.cliente.update({
        where: { usuarioId },
        data: { direccionPredeterminadaId: id },
      });
      // 3. Marcar la dirección elegida como principal y devolverla.
      return tx.direccion.update({
        where: { id },
        data: { esPrincipal: true },
      });
    });
  }

  /**
   * Elimina una dirección por su identificador.
   * @param id identificador de la dirección a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.direccion.delete({ where: { id } });
  }
}

/** Instancia única (singleton) del repositorio de direcciones. */
export const repositorioDirecciones = new RepositorioDirecciones();
