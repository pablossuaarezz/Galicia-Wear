// Repositorio del módulo de variantes: encapsula el acceso a datos (Prisma)
// para la entidad Variante (combinación talla/color/SKU/stock de un producto).
// Se usa directamente el tipo `Variante` generado por Prisma, sin necesidad
// de un tipo "detalle" propio, ya que la variante no anida otras relaciones.

import { Variante } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import type { DatosCrearVariante, DatosActualizarVariante } from './dto';

export class RepositorioVariantes extends RepositorioBase<Variante> {
  /**
   * Busca una variante por su id.
   * @param id Identificador de la variante.
   * @returns La variante o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<Variante | null> {
    return this.bd.variante.findUnique({ where: { id } });
  }

  /**
   * Lista todas las variantes de un producto, ordenadas por talla y luego
   * por color, para una presentación consistente en el detalle del producto.
   * @param productoId Identificador del producto padre.
   * @returns Lista de variantes del producto.
   */
  async listarDeProducto(productoId: string): Promise<Variante[]> {
    return this.bd.variante.findMany({
      where: { productoId },
      orderBy: [{ talla: 'asc' }, { color: 'asc' }],
    });
  }

  /**
   * Crea una nueva variante asociada al producto indicado.
   * @param productoId Identificador del producto padre.
   * @param datos Datos validados de creación (`DatosCrearVariante`).
   * @returns La variante creada.
   */
  async crear(productoId: string, datos: DatosCrearVariante): Promise<Variante> {
    return this.bd.variante.create({
      data: {
        productoId,
        talla: datos.talla,
        color: datos.color,
        // El SKU se normaliza siempre a mayúsculas para evitar duplicados
        // por diferencias de capitalización (p. ej. "abc-1" vs "ABC-1").
        sku: datos.sku.toUpperCase(),
        stock: datos.stock ?? 0,
        ajustePrecio: datos.ajustePrecio ?? 0,
      },
    });
  }

  /**
   * Actualiza parcialmente una variante existente. Solo se incluyen en la
   * operación `update` los campos definidos en `datos`.
   * @param id Identificador de la variante.
   * @param datos Campos a actualizar (`DatosActualizarVariante`).
   * @returns La variante actualizada.
   */
  async actualizar(id: string, datos: DatosActualizarVariante): Promise<Variante> {
    return this.bd.variante.update({
      where: { id },
      data: {
        ...(datos.talla !== undefined && { talla: datos.talla }),
        ...(datos.color !== undefined && { color: datos.color }),
        // Igual que en `crear`, se normaliza el SKU a mayúsculas si se actualiza.
        ...(datos.sku !== undefined && { sku: datos.sku.toUpperCase() }),
        ...(datos.stock !== undefined && { stock: datos.stock }),
        ...(datos.ajustePrecio !== undefined && { ajustePrecio: datos.ajustePrecio }),
      },
    });
  }

  /**
   * Elimina físicamente una variante de la base de datos.
   * @param id Identificador de la variante a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.variante.delete({ where: { id } });
  }
}

// Instancia única (singleton) del repositorio, usada por el servicio de variantes.
export const repositorioVariantes = new RepositorioVariantes();
