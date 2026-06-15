// Endpoints de imágenes de prenda (anidados bajo producto). Envueltos en { imagenes } / { imagen }.
// La subida acepta una URL directa o un data URI base64 que el backend guarda en /uploads.
import { solicitar } from '../clienteApi';
import type { EntradaImagen, ImagenProducto } from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST de imágenes de una prenda. Todas las rutas
 * están anidadas bajo el producto al que pertenecen (/productos/:productoId/imagenes).
 */
export const apiImagenes = {
  /**
   * Lista las imágenes asociadas a un producto. Llama a GET /productos/:productoId/imagenes.
   * @param productoId Identificador del producto cuyas imágenes se piden.
   * @returns Array de imágenes (se desenvuelve la clave `imagenes`).
   */
  async listar(productoId: string): Promise<ImagenProducto[]> {
    const { imagenes } = await solicitar<{ imagenes: ImagenProducto[] }>(
      `/productos/${productoId}/imagenes`,
    );
    return imagenes;
  },

  /**
   * Añade una nueva imagen a un producto. Llama a POST /productos/:productoId/imagenes.
   * El cuerpo admite una URL directa o un data URI base64 que el backend persiste en /uploads.
   * @param productoId Identificador del producto destino.
   * @param datos Datos de la imagen (URL o base64 y metadatos).
   * @returns La imagen creada.
   */
  async crear(productoId: string, datos: EntradaImagen): Promise<ImagenProducto> {
    const { imagen } = await solicitar<{ imagen: ImagenProducto }>(
      `/productos/${productoId}/imagenes`,
      { metodo: 'POST', cuerpo: datos },
    );
    return imagen;
  },

  /**
   * Marca una imagen como principal (la que se muestra como portada del producto).
   * Llama a PATCH /productos/:productoId/imagenes/:id/principal.
   * @param productoId Identificador del producto.
   * @param id Identificador de la imagen a marcar como principal.
   * @returns La imagen actualizada.
   */
  async marcarPrincipal(productoId: string, id: string): Promise<ImagenProducto> {
    const { imagen } = await solicitar<{ imagen: ImagenProducto }>(
      `/productos/${productoId}/imagenes/${id}/principal`,
      { metodo: 'PATCH' },
    );
    return imagen;
  },

  /**
   * Elimina una imagen de un producto. Llama a DELETE /productos/:productoId/imagenes/:id.
   * @param productoId Identificador del producto.
   * @param id Identificador de la imagen a eliminar.
   */
  eliminar(productoId: string, id: string): Promise<void> {
    return solicitar<void>(`/productos/${productoId}/imagenes/${id}`, { metodo: 'DELETE' });
  },
};
