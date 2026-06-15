// Acceso a datos del módulo de imágenes de producto mediante Prisma.
// Gestiona la tabla `imagenProducto`: listado ordenado, creación, actualización
// de metadatos, marcado de imagen principal (con desmarcado del resto en una
// transacción) y eliminación.
import { ImagenProducto } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearImagen, DatosActualizarImagen } from './dto';

/**
 * Repositorio del módulo de imágenes de producto.
 * Encapsula las operaciones de lectura/escritura sobre la tabla `imagenProducto`.
 */
export class RepositorioImagenes extends RepositorioBase<ImagenProducto> {
  /**
   * Busca una imagen por su id.
   * @param id id de la imagen.
   * @returns la imagen encontrada, o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<ImagenProducto | null> {
    return this.bd.imagenProducto.findUnique({ where: { id } });
  }

  /**
   * Lista todas las imágenes de un producto, ordenadas de forma que la imagen
   * principal aparezca primero y, dentro de cada grupo (principal/no principal),
   * por su campo `posicion` ascendente.
   * @param productoId id del producto.
   * @returns array de imágenes del producto en el orden de visualización.
   */
  async listarDeProducto(productoId: string): Promise<ImagenProducto[]> {
    return this.bd.imagenProducto.findMany({
      where: { productoId },
      orderBy: [{ esPrincipal: 'desc' }, { posicion: 'asc' }],
    });
  }

  /**
   * Crea una nueva imagen asociada a un producto.
   * @param productoId id del producto al que pertenece la imagen.
   * @param datos datos de la imagen ya validados por zod.
   * @returns la imagen creada.
   */
  async crear(productoId: string, datos: DatosCrearImagen): Promise<ImagenProducto> {
    return this.bd.imagenProducto.create({
      data: {
        productoId,
        // El controlador garantiza una URL (directa o derivada del base64 subido).
        // Por eso aquí se usa '' como fallback defensivo, aunque en la práctica
        // siempre debería llegar un valor por el `.refine` del DTO + controlador.
        url: datos.url ?? '',
        textoAlternativo: datos.textoAlternativo ?? null,
        posicion: datos.posicion ?? 0,
        esPrincipal: datos.esPrincipal ?? false,
      },
    });
  }

  /**
   * Actualiza los metadatos de una imagen (texto alternativo y/o posición).
   * Solo se incluyen en el `data` de Prisma los campos presentes en `datos`,
   * permitiendo una actualización parcial tipo PATCH.
   * @param id id de la imagen a actualizar.
   * @param datos campos a modificar (todos opcionales).
   * @returns la imagen actualizada.
   */
  async actualizar(id: string, datos: DatosActualizarImagen): Promise<ImagenProducto> {
    return this.bd.imagenProducto.update({
      where: { id },
      data: {
        ...(datos.textoAlternativo !== undefined && { textoAlternativo: datos.textoAlternativo }),
        ...(datos.posicion !== undefined && { posicion: datos.posicion }),
      },
    });
  }

  /**
   * Marca una imagen como principal del producto, desmarcando previamente
   * cualquier otra imagen del mismo producto que tuviera ese flag activo.
   * Ambas operaciones se ejecutan en una transacción para garantizar que en
   * ningún momento intermedio queden cero o más de una imagen principal
   * de forma persistida de manera inconsistente.
   * @param id id de la imagen que pasa a ser principal.
   * @param productoId id del producto al que pertenece la imagen.
   * @returns la imagen marcada como principal.
   */
  async marcarPrincipal(id: string, productoId: string): Promise<ImagenProducto> {
    return this.bd.$transaction(async (tx) => {
      // Desmarca como principal cualquier otra imagen del mismo producto
      // (excluyendo la que se va a marcar) para mantener una única principal.
      await tx.imagenProducto.updateMany({
        where: { productoId, id: { not: id } },
        data: { esPrincipal: false },
      });
      return tx.imagenProducto.update({
        where: { id },
        data: { esPrincipal: true },
      });
    });
  }

  /**
   * Elimina una imagen por su id.
   * @param id id de la imagen a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.imagenProducto.delete({ where: { id } });
  }
}

// Instancia única (singleton) del repositorio, reutilizada por el servicio.
export const repositorioImagenes = new RepositorioImagenes();
