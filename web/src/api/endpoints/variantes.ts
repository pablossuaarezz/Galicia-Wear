// Endpoints de variantes (anidados bajo un producto). Envueltos en { variantes } / { variante }.
import { solicitar } from '../clienteApi';
import type { EntradaVariante, Variante } from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST de variantes de una prenda (combinaciones
 * de talla/color con su propio SKU y stock). Todas las rutas están anidadas bajo el
 * producto al que pertenecen (/productos/:productoId/variantes).
 */
export const apiVariantes = {
  /**
   * Lista las variantes de un producto. Llama a GET /productos/:productoId/variantes.
   * @param productoId Identificador del producto.
   * @returns Array de variantes (se desenvuelve la clave `variantes`).
   */
  async listar(productoId: string): Promise<Variante[]> {
    const { variantes } = await solicitar<{ variantes: Variante[] }>(
      `/productos/${productoId}/variantes`,
    );
    return variantes;
  },

  /**
   * Crea una nueva variante para un producto. Llama a POST /productos/:productoId/variantes.
   * @param productoId Identificador del producto destino.
   * @param datos Datos de la variante (talla, color, SKU, stock).
   * @returns La variante creada.
   */
  async crear(productoId: string, datos: EntradaVariante): Promise<Variante> {
    const { variante } = await solicitar<{ variante: Variante }>(
      `/productos/${productoId}/variantes`,
      { metodo: 'POST', cuerpo: datos },
    );
    return variante;
  },

  /**
   * Actualiza una variante existente (parcialmente). Llama a
   * PATCH /productos/:productoId/variantes/:id.
   * @param productoId Identificador del producto.
   * @param id Identificador de la variante a modificar.
   * @param datos Campos de la variante a actualizar (parciales).
   * @returns La variante ya actualizada.
   */
  async actualizar(
    productoId: string,
    id: string,
    datos: Partial<EntradaVariante>,
  ): Promise<Variante> {
    const { variante } = await solicitar<{ variante: Variante }>(
      `/productos/${productoId}/variantes/${id}`,
      { metodo: 'PATCH', cuerpo: datos },
    );
    return variante;
  },

  /**
   * Elimina una variante de un producto. Llama a
   * DELETE /productos/:productoId/variantes/:id.
   * @param productoId Identificador del producto.
   * @param id Identificador de la variante a eliminar.
   */
  eliminar(productoId: string, id: string): Promise<void> {
    return solicitar<void>(`/productos/${productoId}/variantes/${id}`, { metodo: 'DELETE' });
  },
};
